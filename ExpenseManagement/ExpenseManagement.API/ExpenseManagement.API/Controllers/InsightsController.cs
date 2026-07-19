using ExpenseManagement.API.Data;
using ExpenseManagement.API.Helper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text;
using System.Text.Json;

namespace ExpenseManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [EnableRateLimiting("ai")]
    public class InsightsController : ControllerBase
    {
        private const int MaximumExpenseRecords = 500;
        private readonly ApplicationDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public InsightsController(
            ApplicationDbContext context,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpPost("analyze")]
        [RequestSizeLimit(4096)]
        public async Task<IActionResult> Analyze([FromBody] JsonElement request, CancellationToken cancellationToken)
        {
            var userId = User.GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();

            if (!TryReadOptionalInt(request, "month", out var requestedMonth) ||
                !TryReadOptionalInt(request, "year", out var requestedYear))
            {
                return BadRequest(new ProblemDetails { Title = "Invalid request", Detail = "Month and year must be whole numbers." });
            }

            var month = requestedMonth ?? DateTime.UtcNow.Month;
            var year = requestedYear ?? DateTime.UtcNow.Year;
            if (month is < 1 or > 12 || year is < 2000 or > 2100)
                return BadRequest(new ProblemDetails { Title = "Invalid request", Detail = "Month or year is outside the supported range." });

            var apiKey = _configuration["Gemini:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new ProblemDetails { Title = "AI service unavailable", Detail = "Gemini is not configured on the server." });

            var records = await _context.Expenses
                .AsNoTracking()
                .Where(expense => expense.UserId == userId && !expense.IsDelete && expense.Date.Month == month && expense.Date.Year == year)
                .Include(expense => expense.Category)
                .Take(MaximumExpenseRecords + 1)
                .Select(expense => new
                {
                    Category = expense.Category.CategoryName,
                    expense.Amount
                })
                .ToListAsync(cancellationToken);

            if (records.Count > MaximumExpenseRecords)
                return BadRequest(new ProblemDetails { Title = "Request too large", Detail = "The selected month contains too many transactions for AI analysis." });

            if (records.Count == 0)
            {
                return Ok(new
                {
                    insights = new[] { $"No expenses were recorded for {month:00}/{year}." },
                    warnings = Array.Empty<string>(),
                    tips = Array.Empty<string>()
                });
            }

            var minimizedFinancialData = new
            {
                month,
                year,
                totalSpent = records.Sum(item => item.Amount),
                transactionCount = records.Count,
                categories = records
                    .GroupBy(item => item.Category)
                    .Select(group => new { name = group.Key, total = group.Sum(item => item.Amount), count = group.Count() })
                    .OrderByDescending(item => item.total)
            };

            var prompt = "Return only valid JSON with arrays named insights, warnings, and tips. " +
                "Provide concise personal-finance observations based only on this monthly aggregate data: " +
                JsonSerializer.Serialize(minimizedFinancialData);

            var payload = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                }
            };

            var model = _configuration["Gemini:Model"] ?? "gemini-2.0-flash-lite";
            using var message = new HttpRequestMessage(HttpMethod.Post, $"models/{Uri.EscapeDataString(model)}:generateContent")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            message.Headers.TryAddWithoutValidation("X-goog-api-key", apiKey);

            try
            {
                var client = _httpClientFactory.CreateClient("Gemini");
                using var response = await client.SendAsync(message, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                var responseText = await response.Content.ReadAsStringAsync(cancellationToken);

                if (response.StatusCode == HttpStatusCode.TooManyRequests)
                    return StatusCode(StatusCodes.Status503ServiceUnavailable, new ProblemDetails { Title = "AI service busy", Detail = "The AI quota is temporarily unavailable. Please try again later." });

                if (!response.IsSuccessStatusCode)
                    return StatusCode(StatusCodes.Status502BadGateway, new ProblemDetails { Title = "AI service error", Detail = "The AI provider could not complete the request." });

                if (!TryReadGeneratedJson(responseText, out var result))
                    return StatusCode(StatusCodes.Status502BadGateway, new ProblemDetails { Title = "Invalid AI response", Detail = "The AI provider returned an invalid response." });

                return Ok(result);
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new ProblemDetails { Title = "AI request timed out", Detail = "The AI provider did not respond in time." });
            }
            catch (HttpRequestException)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new ProblemDetails { Title = "AI service unavailable", Detail = "The AI provider is currently unavailable." });
            }
        }

        private static bool TryReadOptionalInt(JsonElement request, string propertyName, out int? result)
        {
            result = null;
            if (request.ValueKind != JsonValueKind.Object || !request.TryGetProperty(propertyName, out var value))
                return true;

            if (value.ValueKind != JsonValueKind.Number || !value.TryGetInt32(out var parsed))
                return false;

            result = parsed;
            return true;
        }

        private static bool TryReadGeneratedJson(string providerResponse, out object? result)
        {
            result = null;
            try
            {
                using var document = JsonDocument.Parse(providerResponse);
                var text = document.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                if (string.IsNullOrWhiteSpace(text))
                    return false;

                text = text.Trim();
                if (text.StartsWith("```", StringComparison.Ordinal))
                {
                    text = text.Replace("```json", string.Empty, StringComparison.OrdinalIgnoreCase)
                        .Replace("```", string.Empty, StringComparison.Ordinal)
                        .Trim();
                }

                result = JsonSerializer.Deserialize<object>(text);
                return result != null;
            }
            catch (JsonException)
            {
                return false;
            }
            catch (InvalidOperationException)
            {
                return false;
            }
        }
    }
}
