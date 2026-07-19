namespace ExpenseManagement.API.DTOs.Dashboard
{
    public class SummaryDto
    {
        public decimal TotalExpense { get; set; }
        public decimal ThisMonthExpense { get; set; }
        public double PercentageChange { get; set; } 
        public string TopCategoryName { get; set; }
        public decimal TopCategoryAmount { get; set; }
        public decimal LastMonthTotal { get; set; }
    }
}
