using ExpenseManagement.API.Contracts;
using ExpenseManagement.API.DTOs.CategoryBudget;
using ExpenseManagement.API.Resources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using ExpenseManagement.API.Helper;

namespace ExpenseManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoryBudgetsController : ControllerBase
    {
        private readonly ICategoryBudgetRepository _repository;
        private readonly IStringLocalizer<SharedResource> _localizer;

        public CategoryBudgetsController(
            ICategoryBudgetRepository repository,
            IStringLocalizer<SharedResource> localizer)
        {
            _repository = repository;
            _localizer  = localizer;
        }

        private string UserId => User.GetUserId()!;

        [HttpGet("summary")]
        public async Task<IActionResult> GetMonthlySummary([FromQuery] int? month, [FromQuery] int? year)
        {
            var m = month ?? DateTime.UtcNow.Month;
            var y = year ?? DateTime.UtcNow.Year;
            if (!IsValidPeriod(m, y))
                return BadRequest(new { message = "Month must be between 1 and 12, and year between 2000 and 2100." });

            var summary = await _repository.GetMonthlySummary(m, y, UserId);
            return Ok(summary);
        }

        [HttpGet]
        public async Task<IActionResult> GetBudget(
            [FromQuery] int categoryId, [FromQuery] int? month, [FromQuery] int? year)
        {
            var m = month ?? DateTime.UtcNow.Month;
            var y = year ?? DateTime.UtcNow.Year;
            if (categoryId <= 0 || !IsValidPeriod(m, y))
                return BadRequest(new { message = "A valid category, month, and year are required." });

            var budget = await _repository.GetBudget(categoryId, m, y, UserId);
            if (budget == null) return NotFound();
            return Ok(budget);
        }

        [HttpPost]
        public async Task<IActionResult> SetBudget([FromBody] SetCategoryBudgetDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _repository.SetBudget(dto, UserId);
            return Ok(result);
        }

        [HttpPost("carry-forward")]
        public async Task<IActionResult> CarryForward([FromQuery] int? fromMonth, [FromQuery] int? fromYear)
        {
            var m = fromMonth ?? DateTime.UtcNow.Month;
            var y = fromYear ?? DateTime.UtcNow.Year;
            if (!IsValidPeriod(m, y) || (m == 12 && y == 2100))
                return BadRequest(new { message = "A valid source month and year are required." });

            var success = await _repository.CopyBudgetsToNextMonth(m, y, UserId);

            if (!success)
                return BadRequest(new { message = _localizer["budgets_not_found"].Value });

            // {0} = "April 2026"
            var monthLabel = new DateTime(y, m, 1).ToString("MMMM yyyy");
            return Ok(new { message = string.Format(_localizer["budgets_carried_forward"], monthLabel) });
        }

        private static bool IsValidPeriod(int month, int year) =>
            month is >= 1 and <= 12 && year is >= 2000 and <= 2100;

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _repository.DeleteBudget(id, UserId);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
