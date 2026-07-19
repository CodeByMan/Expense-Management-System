namespace ExpenseManagement.API.Models
{
    public class CategoryBudget
    {
        public int Id { get; set; }
        public int Month { get; set; }   // 1–12
        public int Year { get; set; }    // e.g. 2026
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // FK to Category
        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        // FK to User
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;
    }
}
