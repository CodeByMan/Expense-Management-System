using ExpenseManagement.API.Contracts;
using ExpenseManagement.API.Data;
using ExpenseManagement.API.DTOs.Account;
using ExpenseManagement.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Data;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ExpenseManagement.API.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;
        public UserRepository(
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _configuration = configuration;
            _context = context;
        }

        public async Task<UserDto> Login(string email, string password)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null || await _userManager.IsLockedOutAsync(user))
                return null;

            if (!await _userManager.CheckPasswordAsync(user, password))
            {
                await _userManager.AccessFailedAsync(user);
                return null;
            }

            await _userManager.ResetAccessFailedCountAsync(user);
            if (!user.EmailConfirmed)
                return null;

            await SeedStarterDataFromSqlAsync(user.Id);

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "User";

            var activeTokens = await _context.RefreshTokens
                .Where(token => token.UserId == user.Id && token.RevokedOn == null)
                .ToListAsync();

            foreach (var activeToken in activeTokens)
                activeToken.RevokedOn = DateTime.UtcNow;

            var refreshToken = GenerateRefreshToken();
            refreshToken.UserId = user.Id;
            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            return await CreateUserDto(user, role, refreshToken);
        }

        public async Task<UserDto> RefreshToken(string token)
        {
            IDbContextTransaction? transaction = null;
            if (_context.Database.IsRelational())
                transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            try
            {
                var refreshToken = await _context.RefreshTokens
                    .Include(item => item.User)
                    .FirstOrDefaultAsync(item => item.Token == token);

                if (refreshToken == null || refreshToken.RevokedOn != null)
                    return null;

                if (refreshToken.ExpiresOn <= DateTime.UtcNow)
                {
                    refreshToken.RevokedOn = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    if (transaction != null)
                        await transaction.CommitAsync();
                    return null;
                }

                refreshToken.RevokedOn = DateTime.UtcNow;
                var newRefreshToken = GenerateRefreshToken();
                newRefreshToken.UserId = refreshToken.UserId;
                _context.RefreshTokens.Add(newRefreshToken);

                await _context.SaveChangesAsync();
                if (transaction != null)
                    await transaction.CommitAsync();

                var roles = await _userManager.GetRolesAsync(refreshToken.User);
                var role = roles.FirstOrDefault() ?? "User";
                return await CreateUserDto(refreshToken.User, role, newRefreshToken);
            }
            catch (DbUpdateException)
            {
                if (transaction != null)
                    await transaction.RollbackAsync();
                return null;
            }
            finally
            {
                if (transaction != null)
                    await transaction.DisposeAsync();
            }
        }

        public async Task<RegisterResult> Registeration(RegisterDto registerDto)
        {
            var userExists = await _userManager.FindByEmailAsync(registerDto.Email);
            if (userExists != null)
                return new RegisterResult(false, "User already exists.", false);

            var user = new ApplicationUser
            {
                FirstName = registerDto.FirstName.Trim(),
                LastName = registerDto.LastName.Trim(),
                Email = registerDto.Email.Trim(),
                UserName = registerDto.Email.Trim()
            };

            var createResult = await _userManager.CreateAsync(user, registerDto.Password);
            if (!createResult.Succeeded)
            {
                var errors = string.Join(", ", createResult.Errors.Select(error => error.Description));
                return new RegisterResult(false, errors, false);
            }

            var roleResult = await _userManager.AddToRoleAsync(user, "User");
            if (!roleResult.Succeeded)
            {
                await _userManager.DeleteAsync(user);
                var errors = string.Join(", ", roleResult.Errors.Select(error => error.Description));
                return new RegisterResult(false, errors, false);
            }

            return new RegisterResult(true, "User registered successfully.", false);
        }

        public async Task<bool> Logout(string refreshToken, string userId)
        {
            var token = await _context.RefreshTokens
                .FirstOrDefaultAsync(item => item.Token == refreshToken && item.UserId == userId);

            if (token == null)
                return false;

            var userTokens = await _context.RefreshTokens
                .Where(item => item.UserId == userId && item.RevokedOn == null)
                .ToListAsync();

            foreach (var userToken in userTokens)
                userToken.RevokedOn = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<UserDto> CreateUserDto(ApplicationUser user, string role, RefreshToken refreshToken)
        {
            var jwtToken = await GenerateJwtToken(user, role);
            return new UserDto
            {
                Id = user.Id,
                UserName = $"{user.FirstName} {user.LastName}",
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                ProfileImageUrl = user.ProfileImageUrl,
                Token = jwtToken,
                RefreshToken = refreshToken.Token,
                ExpiresOn = refreshToken.ExpiresOn
            };
        }

        private async Task<string> GenerateJwtToken(ApplicationUser user, string role)
        {
            var key = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT signing key is not configured.");
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Role, role),
                new Claim("AspNet.Identity.SecurityStamp", await _userManager.GetSecurityStampAsync(user)),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(30),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static RefreshToken GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            RandomNumberGenerator.Fill(randomNumber);

            return new RefreshToken
            {
                Token = Convert.ToBase64String(randomNumber),
                ExpiresOn = DateTime.UtcNow.AddDays(2),
                CreatedOn = DateTime.UtcNow
            };
        }

        private async Task SeedStarterDataFromSqlAsync(string userId)
        {
            if (!_context.Database.IsRelational())
                return;

            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"EXEC dbo.SeedExpenseManagementStarterData @UserId = {userId}");
        }

    }
}
