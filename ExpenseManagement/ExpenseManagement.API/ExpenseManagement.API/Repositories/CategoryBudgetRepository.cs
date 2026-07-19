using ExpenseManagement.API.Contracts;
using ExpenseManagement.API.Data;
using ExpenseManagement.API.DTOs.CategoryBudget;
using ExpenseManagement.API.Hubs;
using ExpenseManagement.API.Models;
using ExpenseManagement.API.Resources;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.Repositories
{
    public class CategoryBudgetRepository : ICategoryBudgetRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IStringLocalizer<SharedResource> _localizer;
        public CategoryBudgetRepository(
              ApplicationDbContext context,
              IHubContext<NotificationHub> hubContext,
              IStringLocalizer<SharedResource> localizer)
        {
            _context = context;
            _hubContext = hubContext;
            _localizer = localizer;
        }
        // ── Get monthly summary (all categories + their spend) ────────────────

        public async Task<MonthlySummaryDto> GetMonthlySummary(int month, int year, string userId)
        {
            // All budgets for this user/month/year
            var budgets = await _context.CategoryBudgets
                .Include(b => b.Category)
                .Where(b => b.UserId == userId && b.Month == month && b.Year == year
                            && !b.Category.IsDelete)
                .ToListAsync();

            // All expenses in this month/year for the user
            var expenses = await _context.Expenses
                .Where(e => e.UserId == userId && !e.IsDelete
                            && e.Date.Month == month && e.Date.Year == year)
                .ToListAsync();

            var spendByCategory = expenses
                .GroupBy(e => e.CategoryId)
                .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

            var categoryDtos = budgets.Select(b =>
            {
                var spent = spendByCategory.GetValueOrDefault(b.CategoryId, 0);
                return new CategoryBudgetDto
                {
                    Id = b.Id,
                    CategoryId = b.CategoryId,
                    CategoryName = b.Category.CategoryName,
                    Icon = b.Category.Icon ?? string.Empty,
                    Color = b.Category.Color ?? string.Empty,
                    Month = b.Month,
                    Year = b.Year,
                    Amount = b.Amount,
                    TotalSpent = spent,
                };
            }).ToList();



            var allocatedThisMonth = await _context.SurplusAllocations
      .Where(a => a.UserId == userId && a.Month == month && a.Year == year)
      .SumAsync(a => a.Amount);

            return new MonthlySummaryDto
            {
                Month = month,
                Year = year,
                TotalBudget = categoryDtos.Sum(c => c.Amount),
                TotalSpent = categoryDtos.Sum(c => c.TotalSpent),
                TotalAllocatedToSavings = allocatedThisMonth,  
                Categories = categoryDtos
            };
        }

        // ── Get single category budget ─────────────────────────────────────────

        public async Task<CategoryBudgetDto?> GetBudget(int categoryId, int month, int year, string userId)
        {
            var b = await _context.CategoryBudgets
                .Include(x => x.Category)
                .FirstOrDefaultAsync(x => x.CategoryId == categoryId
                                          && x.Month == month && x.Year == year
                                          && x.UserId == userId);

            if (b == null) return null;

            var spent = await _context.Expenses
                .Where(e => e.CategoryId == categoryId && e.UserId == userId
                            && !e.IsDelete && e.Date.Month == month && e.Date.Year == year)
                .SumAsync(e => e.Amount);

            return new CategoryBudgetDto
            {
                Id = b.Id,
                CategoryId = b.CategoryId,
                CategoryName = b.Category.CategoryName,
                Icon = b.Category.Icon ?? string.Empty,
                Color = b.Category.Color ?? string.Empty,
                Month = b.Month,
                Year = b.Year,
                Amount = b.Amount,
                TotalSpent = spent,
            };
        }

        // ── Upsert budget ──────────────────────────────────────────────────────

        public async Task<CategoryBudgetDto> SetBudget(SetCategoryBudgetDto dto, string userId)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(item => item.Id == dto.CategoryId && item.UserId == userId && !item.IsDelete);
            if (category == null)
                throw new ValidationException("Selected category is invalid.");

            var existing = await _context.CategoryBudgets
                .FirstOrDefaultAsync(b => b.CategoryId == dto.CategoryId
                                          && b.Month == dto.Month && b.Year == dto.Year
                                          && b.UserId == userId);

            if (existing != null)
            {
                existing.Amount = dto.Amount;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                existing = new CategoryBudget
                {
                    CategoryId = dto.CategoryId,
                    Month = dto.Month,
                    Year = dto.Year,
                    Amount = dto.Amount,
                    UserId = userId
                };
                _context.CategoryBudgets.Add(existing);
            }

            await _context.SaveChangesAsync();

            // Check spend against new budget and notify if needed
            await CheckAndNotifyMonthlyBudget(dto.CategoryId, dto.Month, dto.Year, userId);

            var spent = await _context.Expenses
                .Where(e => e.CategoryId == dto.CategoryId && e.UserId == userId
                            && !e.IsDelete && e.Date.Month == dto.Month && e.Date.Year == dto.Year)
                .SumAsync(e => e.Amount);

            return new CategoryBudgetDto
            {
                Id = existing.Id,
                CategoryId = existing.CategoryId,
                CategoryName = category?.CategoryName ?? string.Empty,
                Icon = category?.Icon ?? string.Empty,
                Color = category?.Color ?? string.Empty,
                Month = existing.Month,
                Year = existing.Year,
                Amount = existing.Amount,
                TotalSpent = spent,
            };
        }

        // ── Copy budgets to next month (carry-forward) ─────────────────────────

        public async Task<bool> CopyBudgetsToNextMonth(int fromMonth, int fromYear, string userId)
        {
            var toMonth = fromMonth == 12 ? 1 : fromMonth + 1;
            var toYear  = fromMonth == 12 ? fromYear + 1 : fromYear;

            var sourceBudgets = await _context.CategoryBudgets
                .Where(b => b.UserId == userId && b.Month == fromMonth && b.Year == fromYear)
                .ToListAsync();

            if (!sourceBudgets.Any()) return false;

            foreach (var source in sourceBudgets)
            {
                var alreadyExists = await _context.CategoryBudgets.AnyAsync(b =>
                    b.UserId == userId && b.CategoryId == source.CategoryId
                    && b.Month == toMonth && b.Year == toYear);

                if (!alreadyExists)
                {
                    _context.CategoryBudgets.Add(new CategoryBudget
                    {
                        CategoryId = source.CategoryId,
                        Month = toMonth,
                        Year = toYear,
                        Amount = source.Amount,
                        UserId = userId
                    });
                }
            }

            return await _context.SaveChangesAsync() > 0;
        }

        // ── Delete ─────────────────────────────────────────────────────────────

        public async Task<bool> DeleteBudget(int id, string userId)
        {
            var budget = await _context.CategoryBudgets
                .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

            if (budget == null) return false;

            _context.CategoryBudgets.Remove(budget);
            return await _context.SaveChangesAsync() > 0;
        }

        // ── SignalR — same pattern as ExpenseRepository ────────────────────────

        public async Task CheckAndNotifyMonthlyBudget(int categoryId, int month, int year, string userId)
        {
            var budget = await _context.CategoryBudgets
                .Include(b => b.Category)
                .FirstOrDefaultAsync(b => b.CategoryId == categoryId
                                          && b.Month == month && b.Year == year
                                          && b.UserId == userId);

            if (budget == null || budget.Amount <= 0) return;

            var totalSpent = await _context.Expenses
                .Where(e => e.CategoryId == categoryId && e.UserId == userId
                            && !e.IsDelete && e.Date.Month == month && e.Date.Year == year)
                .SumAsync(e => e.Amount);

            var percentage = (totalSpent / budget.Amount) * 100;

            if (totalSpent >= budget.Amount)
            {
                await _hubContext.Clients.User(userId).SendAsync("ReceiveNotification",
                    string.Format(_localizer["notif_budget_exceeded"],
                        new DateTime(year, month, 1).ToString("MMMM"),
                        budget.Category.CategoryName));
            }
            else if (percentage >= 90)
            {
                await _hubContext.Clients.User(userId).SendAsync("ReceiveNotification",
                    string.Format(_localizer["notif_budget_warning"],
                        $"{percentage:0}",
                        new DateTime(year, month, 1).ToString("MMMM"),
                        budget.Category.CategoryName));
            }
        }
    }
}
