using ExpenseManagement.API.Contracts;
using ExpenseManagement.API.Data;
using ExpenseManagement.API.DTOs.CategoryBudget;
using ExpenseManagement.API.DTOs.Expense;
using ExpenseManagement.API.Hubs;
using ExpenseManagement.API.Models;
using ExpenseManagement.API.Repositories;
using ExpenseManagement.API.Resources;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Moq;
using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.Tests;

public class RepositoryOwnershipTests
{
    [Fact]
    public async Task ExpenseCannotBeReadByAnotherUser()
    {
        await using var context = CreateContext();
        context.Categories.Add(new Category { Id = 1, CategoryName = "Food", UserId = "owner" });
        context.Expenses.Add(new Expense { Id = 1, Title = "Lunch", Amount = 12, Date = DateTime.UtcNow, CategoryId = 1, UserId = "owner" });
        await context.SaveChangesAsync();

        var repository = new ExpenseRepository(
            context,
            Mock.Of<IHubContext<NotificationHub>>(),
            Mock.Of<ICategoryBudgetRepository>());

        Assert.Null(await repository.GetExpenseById(1, "other-user"));
    }

    [Fact]
    public async Task ExpenseCannotUseAnotherUsersCategory()
    {
        await using var context = CreateContext();
        context.Categories.Add(new Category { Id = 2, CategoryName = "Private", UserId = "owner" });
        await context.SaveChangesAsync();

        var repository = new ExpenseRepository(
            context,
            Mock.Of<IHubContext<NotificationHub>>(),
            Mock.Of<ICategoryBudgetRepository>());

        var dto = new CreateExpenseDto { Title = "Invalid", Amount = 10, Date = DateTime.UtcNow, CategoryId = 2 };
        await Assert.ThrowsAsync<ValidationException>(() => repository.AddExpense(dto, "other-user"));
    }

    [Fact]
    public async Task BudgetCannotUseAnotherUsersCategory()
    {
        await using var context = CreateContext();
        context.Categories.Add(new Category { Id = 3, CategoryName = "Private", UserId = "owner" });
        await context.SaveChangesAsync();

        var repository = new CategoryBudgetRepository(
            context,
            Mock.Of<IHubContext<NotificationHub>>(),
            Mock.Of<IStringLocalizer<SharedResource>>());

        var dto = new SetCategoryBudgetDto { CategoryId = 3, Month = 7, Year = 2026, Amount = 100 };
        await Assert.ThrowsAsync<ValidationException>(() => repository.SetBudget(dto, "other-user"));
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }
}
