using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.DTOs.CategoryBudget
{
    public class SetCategoryBudgetDto
    {
        [Range(1, int.MaxValue)]
        public int CategoryId { get; set; }

        [Range(1, 12)]
        public int Month { get; set; }

        [Range(2000, 2100)]
        public int Year { get; set; }

        [Range(typeof(decimal), "0", "1000000000")]
        public decimal Amount { get; set; }
    }
}
