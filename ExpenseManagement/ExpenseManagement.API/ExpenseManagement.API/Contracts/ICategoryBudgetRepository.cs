using ExpenseManagement.API.DTOs.CategoryBudget;

namespace ExpenseManagement.API.Contracts
{
    public interface ICategoryBudgetRepository
    {
        /// <summary>Get all category budgets for a specific month/year with their actual spend.</summary>
        Task<MonthlySummaryDto> GetMonthlySummary(int month, int year, string userId);

        /// <summary>Get budget for a single category in a given month/year.</summary>
        Task<CategoryBudgetDto?> GetBudget(int categoryId, int month, int year, string userId);

        /// <summary>Set (upsert) a budget for a category in a given month/year.</summary>
        Task<CategoryBudgetDto> SetBudget(SetCategoryBudgetDto dto, string userId);

        /// <summary>Copy all budgets from one month into the next month (handy "carry forward" feature).</summary>
        Task<bool> CopyBudgetsToNextMonth(int fromMonth, int fromYear, string userId);

        /// <summary>Delete a specific budget entry.</summary>
        Task<bool> DeleteBudget(int id, string userId);
        Task CheckAndNotifyMonthlyBudget(int categoryId, int month, int year, string userId);
    }
}
