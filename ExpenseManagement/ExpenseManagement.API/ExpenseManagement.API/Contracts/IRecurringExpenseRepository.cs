using ExpenseManagement.API.DTOs.RecurringExpense;

namespace ExpenseManagement.API.Contracts
{
    public interface IRecurringExpenseRepository
    {
        Task<IEnumerable<RecurringExpenseDto>> GetAll(string userId);
        Task<RecurringExpenseDto?> GetById(int id, string userId);
        Task<RecurringExpenseDto> Create(CreateRecurringExpenseDto dto, string userId);
        Task<bool> Update(int id, UpdateRecurringExpenseDto dto, string userId);
        Task<bool> Delete(int id, string userId);
        Task<bool> ToggleActive(int id, string userId);

        /// <summary>Called by the background job — processes all due recurring expenses.</summary>
        Task ProcessDueRecurringExpenses(CancellationToken cancellationToken = default);
    }
}
