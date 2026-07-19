using ExpenseManagement.API.Data;
using ExpenseManagement.API.DTOs.Dashboard;
using ExpenseManagement.API.Resources;
using ExpenseManagement.API.Helper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace ExpenseManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IStringLocalizer<SharedResource> _localizer;

        public DashboardController(
            ApplicationDbContext context,
            IStringLocalizer<SharedResource> localizer)
        {
            _context   = context;
            _localizer = localizer;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboardData()
        {
            var userId = User.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var now                = DateTime.Now;
            var today              = now.Date;
            var yesterday          = today.AddDays(-1);
            var firstDayThisMonth  = new DateTime(now.Year, now.Month, 1);
            var firstDayLastMonth  = firstDayThisMonth.AddMonths(-1);

            var userExpenses = _context.Expenses
                .Where(e => e.UserId == userId && !e.IsDelete);

            var thisMonthTotal = await userExpenses
                .Where(e => e.Date >= firstDayThisMonth)
                .SumAsync(e => e.Amount);

            var lastMonthTotal = await userExpenses
                .Where(e => e.Date >= firstDayLastMonth && e.Date < firstDayThisMonth)
                .SumAsync(e => e.Amount);

            double percentageChange = lastMonthTotal > 0
                ? (double)((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
                : 0;

            var topCategories = await userExpenses
                .Where(e => e.Date >= firstDayThisMonth)
                .GroupBy(e => new {
                    e.Category.CategoryName,
                    e.CategoryId,
                    e.Category.Icon,
                    e.Category.Color
                })
                .Select(g => new TopCategoryDto
                {
                    CategoryId   = g.Key.CategoryId,
                    CategoryName = g.Key.CategoryName,
                    Icon         = g.Key.Icon,
                    Color        = g.Key.Color,
                    Amount       = g.Sum(e => e.Amount),
                    Count        = g.Count()
                })
                .OrderByDescending(x => x.Amount)
                .Take(4)
                .ToListAsync();

            if (thisMonthTotal > 0)
                foreach (var cat in topCategories)
                    cat.Percentage = Math.Round((double)(cat.Amount / thisMonthTotal) * 100, 1);

            var topCategory = topCategories.FirstOrDefault();

            var monthlyCharts = await userExpenses
                .Where(e => e.Date >= now.AddMonths(-6))
                .GroupBy(e => new { e.Date.Year, e.Date.Month })
                .Select(g => new { Year = g.Key.Year, Month = g.Key.Month, Total = g.Sum(e => e.Amount) })
                .OrderBy(x => x.Year).ThenBy(x => x.Month)
                .ToListAsync();

            var monthlyChartDtos = monthlyCharts
                .Select(x => new ChartDataDto { Label = x.Month + "/" + x.Year, Total = x.Total })
                .ToList();

            var yearlyCharts = await userExpenses
                .GroupBy(e => e.Date.Year)
                .Select(g => new ChartDataDto { Label = g.Key.ToString(), Total = g.Sum(e => e.Amount) })
                .OrderBy(x => x.Label)
                .ToListAsync();

            var recentData = await userExpenses
                .Where(e => e.Date >= yesterday)
                .OrderByDescending(e => e.Date)
                .Select(e => new { e.Title, e.Amount, e.Date, CategoryName = e.Category.CategoryName })
                .ToListAsync();

            // ── Smart alerts (localized) ───────────────────────────────────
            var alerts = new List<AlertDto>();

            if (percentageChange > 20)
            {
                alerts.Add(new AlertDto
                {
                    Type    = "warning",
                    // {0} = percentage
                    Message = string.Format(_localizer["alert_spending_up"], Math.Round(percentageChange, 1))
                });
            }

            if (percentageChange < -10)
            {
                alerts.Add(new AlertDto
                {
                    Type    = "success",
                    // {0} = percentage
                    Message = string.Format(_localizer["alert_spending_down"], Math.Abs(Math.Round(percentageChange, 1)))
                });
            }

            var dominantCategory = topCategories.FirstOrDefault(c => c.Percentage > 50);
            if (dominantCategory != null)
            {
                alerts.Add(new AlertDto
                {
                    Type    = "info",
                    // {0} = category name, {1} = percentage
                    Message = string.Format(_localizer["alert_dominant_category"],
                                dominantCategory.CategoryName,
                                dominantCategory.Percentage)
                });
            }

            if (thisMonthTotal == 0)
            {
                alerts.Add(new AlertDto
                {
                    Type    = "info",
                    Message = _localizer["alert_no_expenses"]
                });
            }

            var response = new DashboardDto
            {
                Summary = new SummaryDto
                {
                    TotalExpense       = await userExpenses.SumAsync(e => e.Amount),
                    ThisMonthExpense   = thisMonthTotal,
                    LastMonthTotal     = lastMonthTotal,
                    PercentageChange   = Math.Round(percentageChange, 2),
                    TopCategoryName    = topCategory?.CategoryName ?? "N/A",
                    TopCategoryAmount  = topCategory?.Amount ?? 0
                },
                TopCategories  = topCategories,
                MonthlyCharts  = monthlyChartDtos,
                YearlyCharts   = yearlyCharts,
                Alerts         = alerts,
                RecentExpenses = new RecentExpensesDto
                {
                    Today = recentData
                        .Where(d => d.Date.Date == today)
                        .Select(d => new ExpenseShortDto
                        {
                            Title        = d.Title,
                            Amount       = d.Amount,
                            CategoryName = d.CategoryName
                        }).ToList(),
                    Yesterday = recentData
                        .Where(d => d.Date.Date == yesterday)
                        .Select(d => new ExpenseShortDto
                        {
                            Title        = d.Title,
                            Amount       = d.Amount,
                            CategoryName = d.CategoryName
                        }).ToList()
                }
            };

            return Ok(response);
        }
    }
}
