namespace ExpenseManagement.API.DTOs.Dashboard
{
    public class RecentExpensesDto
    {
        public List<ExpenseShortDto> Today { get; set; }
        public List<ExpenseShortDto> Yesterday { get; set; }
    }
}
