using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.DTOs.Expense
{
    public class CreateExpenseDto
    {
        [Required, StringLength(120, MinimumLength = 1)]
        public string Title { get; set; } = string.Empty;

        [Range(typeof(decimal), "0.01", "1000000000")]
        public decimal Amount { get; set; }

        [Range(1, int.MaxValue)]
        public int CategoryId { get; set; }

        public DateTime Date { get; set; }
    }
}
