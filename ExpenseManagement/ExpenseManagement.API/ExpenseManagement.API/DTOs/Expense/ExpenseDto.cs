namespace ExpenseManagement.API.DTOs.Expense
{
    public class ExpenseDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public decimal Amount { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public DateTime Date { get; set; }
    }
}
