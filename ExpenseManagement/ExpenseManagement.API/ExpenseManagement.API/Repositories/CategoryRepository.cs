using ExpenseManagement.API.Contracts;
using ExpenseManagement.API.Data;
using ExpenseManagement.API.DTOs.category;
using ExpenseManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ExpenseManagement.API.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly ApplicationDbContext _dbContext;

        public CategoryRepository(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }
        public async Task<bool> AddAsync(Category category)
        {
            var isExist = await _dbContext.Categories
                 .AnyAsync(c => c.CategoryName == category.CategoryName && c.UserId == category.UserId && !c.IsDelete);

            if (isExist) return false;

            await _dbContext.Categories.AddAsync(category);
            return await _dbContext.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeleteAsync(int id, string userId)
        {
            var existingCategory = await _dbContext.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId && !c.IsDelete);
            if (existingCategory == null)
            {
                return false;
            }

            existingCategory.IsDelete = true;
            existingCategory.UpdatedAt = DateTime.UtcNow;

            _dbContext.Categories.Update(existingCategory);
            return await _dbContext.SaveChangesAsync() > 0;
        }

        public async Task<IEnumerable<Category>> GetAllAsync(string userId)
        {
            return await _dbContext.Categories.Where(c => c.UserId == userId && !c.IsDelete).ToListAsync();
        }

        public Task<Category> GetByIdAsync(int id, string userId)
        {
           return _dbContext.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId && !c.IsDelete);
        }

        public async Task<bool> UpdateAsync(int id, UpdateCategoryDto category, string userId)
        {
            var existingCategory = await _dbContext.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId && !c.IsDelete);

            if (existingCategory == null)
                return false;

            var duplicateName = await _dbContext.Categories.AnyAsync(c =>
                c.Id != id && c.UserId == userId && !c.IsDelete && c.CategoryName == category.CategoryName);
            if (duplicateName)
                return false;

            existingCategory.CategoryName = category.CategoryName.Trim();
            existingCategory.CategoryDescription = category.CategoryDescription;
            existingCategory.Color = category.Color;
            existingCategory.Icon = category.Icon;
            existingCategory.UpdatedAt = DateTime.UtcNow;

            return await _dbContext.SaveChangesAsync() > 0;
        }



    }
}
