using ExpenseManagement.API.Models;
using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.DTOs.RecurringExpense
{
    public class CreateRecurringExpenseDto : IValidatableObject
    {
        [Required, StringLength(120, MinimumLength = 1)]
        public string Title { get; set; } = string.Empty;

        [Range(typeof(decimal), "0.01", "1000000000")]
        public decimal Amount { get; set; }

        [EnumDataType(typeof(RecurrenceInterval))]
        public RecurrenceInterval Interval { get; set; }

        [Range(1, 31)]
        public int DayOfPeriod { get; set; } = 1;

        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        [Range(1, int.MaxValue)]
        public int CategoryId { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (StartDate.Year is < 2000 or > 2100)
                yield return new ValidationResult("Start date is outside the supported range.", [nameof(StartDate)]);

            if (EndDate.HasValue && EndDate.Value < StartDate)
                yield return new ValidationResult("End date cannot be before the start date.", [nameof(EndDate)]);

            if (Interval == RecurrenceInterval.Monthly && DayOfPeriod is < 1 or > 31)
                yield return new ValidationResult("Monthly recurrence day must be between 1 and 31.", [nameof(DayOfPeriod)]);
        }
    }
}
