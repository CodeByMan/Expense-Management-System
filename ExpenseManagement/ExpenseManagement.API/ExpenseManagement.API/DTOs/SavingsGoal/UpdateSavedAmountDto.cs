using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.DTOs.SavingsGoal
{
    public class UpdateSavedAmountDto
    {
        [Range(typeof(decimal), "0", "1000000000")]
        public decimal Saved { get; set; }
    }
}
