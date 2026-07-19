using ExpenseManagement.API.DTOs.Expense;

namespace ExpenseManagement.API.Contracts
{
    public interface IExpenseRepository
    {
        Task<IEnumerable<ExpenseDto>> GetAllExpenses(string userId);
        Task<ExpenseDto> GetExpenseById(int id, string userId);
        Task<ExpenseDto> AddExpense(CreateExpenseDto dto, string userId);
        Task<bool> UpdateExpense(int id, CreateExpenseDto dto, string userId);
        Task<bool> DeleteExpense(int id, string userId);
    }
}
