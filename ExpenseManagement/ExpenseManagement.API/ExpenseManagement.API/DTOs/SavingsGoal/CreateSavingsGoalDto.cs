using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.DTOs.SavingsGoal
{
    public class CreateSavingsGoalDto : IValidatableObject
    {
        [Required, StringLength(100, MinimumLength = 1)]
        public string Name { get; set; } = string.Empty;

        [Range(typeof(decimal), "0.01", "1000000000")]
        public decimal Target { get; set; }

        [Range(typeof(decimal), "0", "1000000000")]
        public decimal Saved { get; set; }

        [Required, StringLength(20)]
        public string Color { get; set; } = "0";

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Saved > Target)
                yield return new ValidationResult("Saved amount cannot exceed the target.", [nameof(Saved)]);
        }
    }
}
