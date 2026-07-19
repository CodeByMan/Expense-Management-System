namespace ExpenseManagement.API.Models
{
    public class SavingsGoal
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Target { get; set; }
        public decimal Saved { get; set; }
        public string Color { get; set; } = "0";
        public bool IsDelete { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        // Foreign key
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;
    }
}
