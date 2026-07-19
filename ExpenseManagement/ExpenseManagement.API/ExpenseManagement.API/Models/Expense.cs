namespace ExpenseManagement.API.Models
{
    public class Expense
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public DateTime CreatedAt { get; set; }= DateTime.Now;
        public DateTime UpdatedAt { get; set; }
        public bool IsDelete { get; set; } = false;
        public int CategoryId { get; set; }
        public Category Category { get; set; }
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }
    }
}
