namespace ExpenseManagement.API.DTOs.CategoryBudget
{
    public class CategoryBudgetDto
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal Amount { get; set; }

        // Computed from expenses for this category/month/year
        public decimal TotalSpent { get; set; }
        public decimal Remaining => Math.Max(Amount - TotalSpent, 0);
        public decimal PercentageUsed => Amount > 0 ? Math.Round((TotalSpent / Amount) * 100, 1) : 0;
        public bool IsOverBudget => TotalSpent > Amount;
        public string MonthName => new DateTime(Year, Month, 1).ToString("MMMM yyyy");
    }
}
