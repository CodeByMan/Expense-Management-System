using ExpenseManagement.API.DTOs.SavingsGoal;

namespace ExpenseManagement.API.Contracts
{
    public interface ISavingsGoalRepository
    {
        Task<IEnumerable<SavingsGoalDto>> GetAllGoals(string userId);
        Task<SavingsGoalDto?> GetGoalById(int id, string userId);
        Task<SavingsGoalDto> AddGoal(CreateSavingsGoalDto dto, string userId);
        Task<bool> UpdateGoal(int id, CreateSavingsGoalDto dto, string userId);
        Task<bool> UpdateSavedAmount(int id, UpdateSavedAmountDto dto, string userId);
        Task<bool> DeleteGoal(int id, string userId);
    }
}
