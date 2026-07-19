using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryDescription { get; set; } = string.Empty;
        public string Icon { get; set; } = "🍔";
        public string Color { get; set; } = "#6366F1";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDelete { get; set; } = false;

        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
        public ICollection<CategoryBudget> Budgets { get; set; } = new List<CategoryBudget>();
    }
}