namespace ExpenseManagement.API.DTOs.SavingsGoal
{
    public class SavingsGoalDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Target { get; set; }
        public decimal Saved { get; set; }
        public string Color { get; set; } = "0";
        public decimal PercentageComplete => Target > 0 ? Math.Round((Saved / Target) * 100, 1) : 0;
        public decimal Remaining => Math.Max(Target - Saved, 0);
        public bool IsComplete => Saved >= Target;
    }
  
}
