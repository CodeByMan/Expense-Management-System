using ExpenseManagement.API.Controllers;
using ExpenseManagement.API.DTOs.Account;
using ExpenseManagement.API.Hubs;
using Microsoft.AspNetCore.Authorization;
using System.Reflection;
using System.Text.Json.Serialization;

namespace ExpenseManagement.API.Tests;

public class SecurityAttributeTests
{
    [Theory]
    [InlineData(typeof(DashboardController))]
    [InlineData(typeof(InsightsController))]
    [InlineData(typeof(ExportController))]
    [InlineData(typeof(NotificationHub))]
    public void PersonalDataEndpointsRequireAuthorization(Type endpointType)
    {
        Assert.NotNull(endpointType.GetCustomAttribute<AuthorizeAttribute>());
    }

    [Fact]
    public void RefreshTokenIsNeverSerializedToTheBrowser()
    {
        var property = typeof(UserDto).GetProperty(nameof(UserDto.RefreshToken));
        Assert.NotNull(property);
        Assert.NotNull(property!.GetCustomAttribute<JsonIgnoreAttribute>());
    }

    [Fact]
    public void LogoutRequiresAuthorization()
    {
        var action = typeof(AccountsController).GetMethod(nameof(AccountsController.Logout));
        Assert.NotNull(action);
        Assert.NotNull(action!.GetCustomAttribute<AuthorizeAttribute>());
    }
}
