namespace ExpenseManagement.API.DTOs.Dashboard
{
    public class TopCategoryDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public int Count { get; set; }          // number of expenses in this category
        public double Percentage { get; set; }  // % of this month's total
        public string Icon { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
    }
}
