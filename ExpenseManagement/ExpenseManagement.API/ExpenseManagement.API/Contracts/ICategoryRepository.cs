using ExpenseManagement.API.DTOs.category;
using ExpenseManagement.API.Models;

namespace ExpenseManagement.API.Contracts
{
    public interface ICategoryRepository
    {
        Task<IEnumerable<Category>> GetAllAsync(string userId);
        Task<Category?> GetByIdAsync(int id, string userId);
        Task<bool> AddAsync(Category category);
        Task<bool> UpdateAsync(int id, UpdateCategoryDto category, string userId);
        Task<bool> DeleteAsync(int id,string userId);
    }
}
