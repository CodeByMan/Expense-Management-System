namespace ExpenseManagement.API.DTOs.Dashboard
{
    public class DashboardDto
    {
        public SummaryDto Summary { get; set; } = new();
        public List<TopCategoryDto> TopCategories { get; set; } = new();
        public List<ChartDataDto> MonthlyCharts { get; set; } = new();
        public List<ChartDataDto> YearlyCharts { get; set; } = new();
        public List<AlertDto> Alerts { get; set; } = new();
        public RecentExpensesDto RecentExpenses { get; set; } = new();
    }

 




   
}
