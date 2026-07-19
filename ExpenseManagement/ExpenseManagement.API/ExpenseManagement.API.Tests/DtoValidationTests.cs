using ExpenseManagement.API.DTOs.CategoryBudget;
using ExpenseManagement.API.DTOs.Expense;
using ExpenseManagement.API.DTOs.RecurringExpense;
using ExpenseManagement.API.DTOs.SavingsGoal;
using ExpenseManagement.API.Models;
using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.Tests;

public class DtoValidationTests
{
    [Fact]
    public void ExpenseRejectsInvalidFinancialValues()
    {
        var dto = new CreateExpenseDto { Title = "Rent", Amount = -1, CategoryId = 0, Date = DateTime.UtcNow };
        Assert.False(IsValid(dto));
    }

    [Fact]
    public void BudgetRejectsInvalidMonthAndAmount()
    {
        var dto = new SetCategoryBudgetDto { CategoryId = 1, Month = 13, Year = 2026, Amount = -1 };
        Assert.False(IsValid(dto));
    }

    [Fact]
    public void SavingsGoalRejectsSavedAmountAboveTarget()
    {
        var dto = new CreateSavingsGoalDto { Name = "Emergency fund", Target = 100, Saved = 101, Color = "#0058be" };
        Assert.False(IsValid(dto));
    }

    [Fact]
    public void RecurringExpenseRejectsImpossibleDateRange()
    {
        var dto = new CreateRecurringExpenseDto
        {
            Title = "Subscription",
            Amount = 10,
            CategoryId = 1,
            Interval = RecurrenceInterval.Monthly,
            DayOfPeriod = 1,
            StartDate = new DateTime(2026, 7, 15),
            EndDate = new DateTime(2026, 7, 14)
        };

        Assert.False(IsValid(dto));
    }

    private static bool IsValid(object value)
    {
        var results = new List<ValidationResult>();
        return Validator.TryValidateObject(value, new ValidationContext(value), results, true);
    }
}
