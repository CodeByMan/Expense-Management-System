namespace ExpenseManagement.API.Models
{
    public enum RecurrenceInterval
    {
        Daily = 0,
        Weekly = 1,
        Monthly = 2,
        Yearly = 3
    }

    public class RecurringExpense
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public RecurrenceInterval Interval { get; set; }

        /// <summary>Day of month (for Monthly), day of week (for Weekly), or 1 (for Daily).</summary>
        public int DayOfPeriod { get; set; } = 1;

        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime LastProcessed { get; set; }
        public DateTime NextDue { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsDelete { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;
    }
}
