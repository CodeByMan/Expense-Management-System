namespace ExpenseManagement.API.DTOs.CategoryBudget
{
    public class MonthlySummaryDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public string MonthName => new DateTime(Year, Month, 1).ToString("MMMM yyyy");
        public decimal TotalBudget { get; set; }
        public decimal TotalSpent { get; set; }
        public decimal Remaining => Math.Max(TotalBudget - TotalSpent, 0);
        public decimal TotalAllocatedToSavings { get; set; }
        public decimal AvailableSurplus => Math.Max(Remaining - TotalAllocatedToSavings, 0);
        public bool IsOverBudget => TotalSpent > TotalBudget;
        public List<CategoryBudgetDto> Categories { get; set; } = new();
    }

   
}
