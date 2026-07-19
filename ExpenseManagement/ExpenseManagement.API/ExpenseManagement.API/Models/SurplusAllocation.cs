namespace ExpenseManagement.API.Models
{
  
        public class SurplusAllocation
        {
            public int Id { get; set; }
            public int Month { get; set; }
            public int Year { get; set; }
            public decimal Amount { get; set; }
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

            public int SavingsGoalId { get; set; }
            public SavingsGoal SavingsGoal { get; set; } = null!;

            public string UserId { get; set; } = string.Empty;
            public ApplicationUser User { get; set; } = null!;
        }
}
