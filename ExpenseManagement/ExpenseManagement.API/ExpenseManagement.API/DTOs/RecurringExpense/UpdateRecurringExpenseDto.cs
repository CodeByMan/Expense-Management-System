namespace ExpenseManagement.API.DTOs.RecurringExpense
{
    public class UpdateRecurringExpenseDto : CreateRecurringExpenseDto
    {
        public bool IsActive { get; set; } = true;
    }
}
