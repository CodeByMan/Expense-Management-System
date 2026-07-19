using ExpenseManagement.API.Data;
using ExpenseManagement.API.Hubs;
using ExpenseManagement.API.Models;
using ExpenseManagement.API.Repositories;
using ExpenseManagement.API.Resources;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Moq;

namespace ExpenseManagement.API.Tests;

public class RecurringExpenseTests
{
    [Fact]
    public async Task ProcessingTheSameDueItemTwiceCreatesOneExpense()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);
        context.Categories.Add(new Category { Id = 1, CategoryName = "Subscriptions", UserId = "user-1" });
        var dueDate = DateTime.UtcNow.AddMinutes(-1);
        context.RecurringExpenses.Add(new RecurringExpense
        {
            Id = 1,
            Title = "Streaming",
            Amount = 15,
            Interval = RecurrenceInterval.Monthly,
            DayOfPeriod = 15,
            StartDate = dueDate,
            LastProcessed = dueDate.AddDays(-1),
            NextDue = dueDate,
            CategoryId = 1,
            UserId = "user-1",
            IsActive = true
        });
        await context.SaveChangesAsync();

        var clientProxy = new Mock<IClientProxy>();
        clientProxy.Setup(client => client.SendCoreAsync(
                It.IsAny<string>(), It.IsAny<object?[]>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var clients = new Mock<IHubClients>();
        clients.Setup(value => value.User(It.IsAny<string>())).Returns(clientProxy.Object);

        var hub = new Mock<IHubContext<NotificationHub>>();
        hub.SetupGet(value => value.Clients).Returns(clients.Object);

        var localizer = new Mock<IStringLocalizer<SharedResource>>();
        localizer.Setup(value => value[It.IsAny<string>()])
            .Returns((string key) => new LocalizedString(key, "Recurring expense {0}: {1}"));

        var repository = new RecurringExpenseRepository(context, hub.Object, localizer.Object);
        await repository.ProcessDueRecurringExpenses();
        await repository.ProcessDueRecurringExpenses();

        Assert.Equal(1, await context.Expenses.CountAsync());
    }
}
