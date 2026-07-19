using ExpenseManagement.API.Contracts;
using ExpenseManagement.API.Data;
using ExpenseManagement.API.DTOs.Account;
using ExpenseManagement.API.Helper;
using ExpenseManagement.API.Helpers;
using ExpenseManagement.API.Models;
using ExpenseManagement.API.Resources;
using ExpenseManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using System.Text;

namespace ExpenseManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountsController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly IEmailTemplateService _emailTemplate;
        private readonly IEmailService _emailService;
        private readonly ApplicationDbContext _context;
        private readonly IStringLocalizer<SharedResource> _localizer;

        public AccountsController(
            IUserRepository userRepository,
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            IEmailTemplateService emailTemplate,
            IEmailService emailService,
            ApplicationDbContext context,
            IStringLocalizer<SharedResource> localizer)
        {
            _userRepository = userRepository;
            _userManager = userManager;
            _configuration = configuration;
            _emailTemplate = emailTemplate;
            _emailService = emailService;
            _context = context;
            _localizer = localizer;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            var result = await _userRepository.Registeration(registerDto);
            if (!result.Success)
                return BadRequest(new ApiResponse<object>(false, result.Message));

            return Ok(new ApiResponse<object>(true, result.Message, new { emailSent = result.EmailSent }));
        }

        [AllowAnonymous]
        [HttpGet("confirmEmail")]
        public async Task<IActionResult> ConfirmEmail(string userId, string token)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return BadRequest(new ApiResponse<object>(false, _localizer["invalid_confirmation_link"]));

            try
            {
                var decodedBytes = WebEncoders.Base64UrlDecode(token);
                var decodedToken = Encoding.UTF8.GetString(decodedBytes);
                var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

                if (!result.Succeeded)
                    return BadRequest(new ApiResponse<object>(false, _localizer["invalid_token"]));

                return Ok(new ApiResponse<object>(true, _localizer["email_confirmed"]));
            }
            catch (FormatException)
            {
                return BadRequest(new ApiResponse<object>(false, _localizer["invalid_confirmation_link"]));
            }
        }

        [AllowAnonymous]
        [HttpPost("send-confirmation-email")]
        public async Task<IActionResult> SendConfirmationEmail([FromBody] SendConfirmationEmailDto request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || await _userManager.IsEmailConfirmedAsync(user))
            {
                return Ok(new ApiResponse<object>(true, _localizer["email_confirmation_sent"]));
            }

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
            var frontendBaseUrl = _configuration["FrontendBaseUrl"]?.TrimEnd('/')
                ?? throw new InvalidOperationException("FrontendBaseUrl is not configured.");
            var confirmLink = $"{frontendBaseUrl}/confirm-email?userId={Uri.EscapeDataString(user.Id)}&token={Uri.EscapeDataString(encodedToken)}";

            var templateValues = new Dictionary<string, string>
            {
                { "UserName", $"{user.FirstName} {user.LastName}" },
                { "ConfirmationLink", confirmLink },
                { "TokenExpiryMinutes", "15" }
            };

            var html = await _emailTemplate.LoadTemplateAsync("ConfirmEmailTemplate", templateValues);
            await _emailService.SendEmailAsync(user.Email!, "Confirm Your Email", html);

            return Ok(new ApiResponse<object>(true, _localizer["email_confirmation_sent"]));
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var loggedInUser = await _userRepository.Login(loginDto.Email, loginDto.Password);
            if (loggedInUser == null)
                return Unauthorized(new ApiResponse<object>(false, "Invalid credentials or unconfirmed email."));

            var userAgent = Request.Headers["User-Agent"].ToString();
            var (browser, os) = UserAgentParser.Parse(userAgent);
            var deviceType = UserAgentParser.GetDeviceType(userAgent);
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

            var oldSessions = await _context.UserSessions
                .Where(session => session.UserId == loggedInUser.Id && session.IsActive)
                .ToListAsync();

            oldSessions.ForEach(session =>
            {
                session.IsActive = false;
                session.LastActiveAt = DateTime.UtcNow;
            });

            _context.UserSessions.Add(new UserSession
            {
                UserId = loggedInUser.Id,
                IpAddress = ip,
                Browser = browser,
                OS = os,
                DeviceInfo = deviceType,
                LoginAt = DateTime.UtcNow,
                IsActive = true
            });

            await _context.SaveChangesAsync();
            SetRefreshTokenInCookie(loggedInUser.RefreshToken, loggedInUser.ExpiresOn);
            return Ok(new ApiResponse<UserDto>(true, _localizer["user_logged_in"], loggedInUser));
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var userId = User.GetUserId();
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(refreshToken))
                return BadRequest(new ApiResponse<object>(false, _localizer["no_refresh_token"]));

            var result = await _userRepository.Logout(refreshToken, userId);
            if (!result)
                return BadRequest(new ApiResponse<object>(false, _localizer["logout_failed"]));

            var sessions = await _context.UserSessions
                .Where(session => session.UserId == userId && session.IsActive)
                .ToListAsync();

            sessions.ForEach(session =>
            {
                session.IsActive = false;
                session.LastActiveAt = DateTime.UtcNow;
            });

            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
                await _userManager.UpdateSecurityStampAsync(user);

            await _context.SaveChangesAsync();
            DeleteRefreshTokenCookie();
            return Ok(new ApiResponse<object>(true, _localizer["user_logged_out"]));
        }

        [AllowAnonymous]
        [HttpPost("refreshToken")]
        public async Task<IActionResult> RefreshToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized(new ApiResponse<object>(false, _localizer["no_refresh_token"]));

            var result = await _userRepository.RefreshToken(refreshToken);
            if (result == null)
            {
                DeleteRefreshTokenCookie();
                return Unauthorized(new ApiResponse<object>(false, _localizer["invalid_session"]));
            }

            SetRefreshTokenInCookie(result.RefreshToken, result.ExpiresOn);
            return Ok(new ApiResponse<UserDto>(true, _localizer["token_refreshed"], result));
        }

        [Authorize]
        [HttpGet("sessions")]
        public async Task<IActionResult> GetSessions()
        {
            var userId = User.GetUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var sessions = await _context.UserSessions
                .Where(session => session.UserId == userId)
                .OrderByDescending(session => session.LoginAt)
                .Take(10)
                .Select(session => new
                {
                    session.Id,
                    session.IpAddress,
                    session.Browser,
                    session.OS,
                    session.DeviceInfo,
                    session.LoginAt,
                    session.LastActiveAt,
                    session.IsActive
                })
                .ToListAsync();

            return Ok(sessions);
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.GetUserId();
            var user = string.IsNullOrWhiteSpace(userId) ? null : await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized();

            return Ok(new ApiResponse<object>(true, "Profile retrieved successfully.", ToProfileResponse(user)));
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
        {
            var userId = User.GetUserId();
            var user = string.IsNullOrWhiteSpace(userId) ? null : await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized();

            user.FirstName = request.FirstName.Trim();
            user.LastName = request.LastName.Trim();
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(new ApiResponse<object>(false, string.Join(", ", result.Errors.Select(error => error.Description))));

            return Ok(new ApiResponse<object>(true, "Profile updated successfully.", ToProfileResponse(user)));
        }

        [Authorize]
        [HttpPost("profile/avatar")]
        [RequestSizeLimit(2 * 1024 * 1024)]
        public async Task<IActionResult> UploadAvatar([FromForm] IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest(new ApiResponse<object>(false, "Select an image to upload."));

            var allowedTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "image/jpeg", "image/png", "image/webp"
            };
            if (!allowedTypes.Contains(image.ContentType))
                return BadRequest(new ApiResponse<object>(false, "Only JPG, PNG and WEBP images are supported."));

            if (image.Length > 2 * 1024 * 1024)
                return BadRequest(new ApiResponse<object>(false, "Profile image must be 2 MB or smaller."));

            var userId = User.GetUserId();
            var user = string.IsNullOrWhiteSpace(userId) ? null : await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized();

            var extension = image.ContentType.ToLowerInvariant() switch
            {
                "image/png" => ".png",
                "image/webp" => ".webp",
                _ => ".jpg"
            };

            var uploadDirectory = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
            Directory.CreateDirectory(uploadDirectory);
            DeleteLocalAvatar(user.ProfileImageUrl, uploadDirectory);

            var fileName = $"{user.Id}-{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadDirectory, fileName);
            await using (var stream = System.IO.File.Create(filePath))
                await image.CopyToAsync(stream);

            user.ProfileImageUrl = $"/uploads/avatars/{fileName}";
            await _userManager.UpdateAsync(user);

            return Ok(new ApiResponse<object>(true, "Profile image updated successfully.", ToProfileResponse(user)));
        }

        [Authorize]
        [HttpDelete("profile/avatar")]
        public async Task<IActionResult> DeleteAvatar()
        {
            var userId = User.GetUserId();
            var user = string.IsNullOrWhiteSpace(userId) ? null : await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized();

            var uploadDirectory = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
            DeleteLocalAvatar(user.ProfileImageUrl, uploadDirectory);
            user.ProfileImageUrl = null;
            await _userManager.UpdateAsync(user);

            return Ok(new ApiResponse<object>(true, "Profile image removed successfully.", ToProfileResponse(user)));
        }

        private static object ToProfileResponse(ApplicationUser user) => new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            UserName = $"{user.FirstName} {user.LastName}",
            user.ProfileImageUrl
        };

        private static void DeleteLocalAvatar(string? profileImageUrl, string uploadDirectory)
        {
            if (string.IsNullOrWhiteSpace(profileImageUrl) || !profileImageUrl.StartsWith("/uploads/avatars/", StringComparison.OrdinalIgnoreCase))
                return;

            var fileName = Path.GetFileName(profileImageUrl);
            var oldPath = Path.Combine(uploadDirectory, fileName);
            if (System.IO.File.Exists(oldPath))
                System.IO.File.Delete(oldPath);
        }

        private void SetRefreshTokenInCookie(string refreshToken, DateTime expires)
        {
            Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = expires,
                IsEssential = true,
                Path = "/api/Accounts"
            });
        }

        private void DeleteRefreshTokenCookie()
        {
            Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                IsEssential = true,
                Path = "/api/Accounts"
            });
        }
    }
}
