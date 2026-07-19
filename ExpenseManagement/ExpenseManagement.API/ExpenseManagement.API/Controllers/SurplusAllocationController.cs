using ExpenseManagement.API.Data;
using ExpenseManagement.API.DTOs.category;
using ExpenseManagement.API.Models;
using ExpenseManagement.API.Resources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using ExpenseManagement.API.Helper;

namespace ExpenseManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SurplusAllocationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IStringLocalizer<SharedResource> _localizer;

        public SurplusAllocationController(
            ApplicationDbContext context,
            IStringLocalizer<SharedResource> localizer)
        {
            _context   = context;
            _localizer = localizer;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllocations([FromQuery] int month, [FromQuery] int year)
        {
            if (month is < 1 or > 12 || year is < 2000 or > 2100)
                return BadRequest(new { message = "Month must be between 1 and 12, and year between 2000 and 2100." });

            var userId = User.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var allocations = await _context.SurplusAllocations
                .Include(a => a.SavingsGoal)
                .Where(a => a.UserId == userId && a.Month == month && a.Year == year)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.Id,
                    a.Amount,
                    a.CreatedAt,
                    SavingsGoalName  = a.SavingsGoal.Name,
                    SavingsGoalColor = a.SavingsGoal.Color,
                })
                .ToListAsync();

            return Ok(allocations);
        }

        [HttpPost]
        public async Task<IActionResult> Allocate([FromBody] AllocateSurplusDto dto)
        {
            var userId = User.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var goal = await _context.SavingsGoals
                .FirstOrDefaultAsync(g => g.Id == dto.SavingsGoalId && g.UserId == userId && !g.IsDelete);

            if (goal == null)
                return NotFound(new { message = _localizer["savings_goal_not_found"].Value });

            var totalBudget = await _context.CategoryBudgets
                .Where(b => b.UserId == userId && b.Month == dto.Month && b.Year == dto.Year)
                .SumAsync(b => b.Amount);

            var totalSpent = await _context.Expenses
                .Where(e => e.UserId == userId && !e.IsDelete
                         && e.Date.Month == dto.Month && e.Date.Year == dto.Year)
                .SumAsync(e => e.Amount);

            var remaining        = Math.Max(totalBudget - totalSpent, 0);
            var alreadyAllocated = await _context.SurplusAllocations
                .Where(a => a.UserId == userId && a.Month == dto.Month && a.Year == dto.Year)
                .SumAsync(a => a.Amount);

            var availableSurplus = Math.Max(remaining - alreadyAllocated, 0);

            if (dto.Amount <= 0)
                return BadRequest(new { message = _localizer["amount_must_be_positive"].Value });

            var remainingGoalAmount = Math.Max(goal.Target - goal.Saved, 0);
            var maximumAllocation = Math.Min(availableSurplus, remainingGoalAmount);

            if (dto.Amount > maximumAllocation)
            {
                // {0} = formatted surplus amount
                return BadRequest(new
                {
                    message = string.Format(_localizer["amount_exceeds_surplus"], $"PKR {maximumAllocation:N2}")
                });
            }

            var allocation = new SurplusAllocation
            {
                Month          = dto.Month,
                Year           = dto.Year,
                Amount         = dto.Amount,
                SavingsGoalId  = dto.SavingsGoalId,
                UserId         = userId,
            };

            _context.SurplusAllocations.Add(allocation);
            goal.Saved += dto.Amount;
            await _context.SaveChangesAsync();

            // {0} = amount, {1} = goal name
            return Ok(new
            {
                message          = string.Format(_localizer["surplus_allocated"], dto.Amount, goal.Name),
                newSaved         = goal.Saved,
                availableSurplus = availableSurplus - dto.Amount,
            });
        }
    }
}
