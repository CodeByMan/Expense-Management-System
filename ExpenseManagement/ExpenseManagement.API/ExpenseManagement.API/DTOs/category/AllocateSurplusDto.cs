using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.DTOs.category
{
    public class AllocateSurplusDto
    {
        [Range(1, int.MaxValue)]
        public int SavingsGoalId { get; set; }

        [Range(1, 12)]
        public int Month { get; set; }

        [Range(2000, 2100)]
        public int Year { get; set; }

        [Range(typeof(decimal), "0.01", "1000000000")]
        public decimal Amount { get; set; }
    }
}
