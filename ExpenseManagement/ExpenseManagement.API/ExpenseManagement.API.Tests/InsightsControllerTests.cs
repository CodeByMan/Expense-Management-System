using ExpenseManagement.API.Controllers;
using ExpenseManagement.API.Data;
using ExpenseManagement.API.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace ExpenseManagement.API.Tests;

public class InsightsControllerTests
{
    [Fact]
    public async Task AnonymousAiRequestIsRejectedBeforeProviderUse()
    {
        await using var context = CreateContext();
        var factory = new Mock<IHttpClientFactory>();
        var controller = CreateController(context, factory.Object, new ClaimsPrincipal());
        using var request = JsonDocument.Parse("{\"month\":7,\"year\":2026}");

        var result = await controller.Analyze(request.RootElement, CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(result);
        factory.Verify(value => value.CreateClient(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task InvalidAiPeriodTypeIsRejectedBeforeProviderUse()
    {
        await using var context = CreateContext();
        var factory = new Mock<IHttpClientFactory>();
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, "user-1")],
            "Test"));
        var controller = CreateController(context, factory.Object, principal);
        using var request = JsonDocument.Parse("{\"month\":\"July\",\"year\":2026}");

        var result = await controller.Analyze(request.RootElement, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
        factory.Verify(value => value.CreateClient(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task AiPromptUsesOnlyAuthenticatedUsersAggregatedData()
    {
        await using var context = CreateContext();
        context.Categories.AddRange(
            new Category { Id = 1, CategoryName = "Food", UserId = "user-1" },
            new Category { Id = 2, CategoryName = "Private", UserId = "user-2" });
        context.Expenses.AddRange(
            new Expense
            {
                Id = 1,
                Title = "My confidential lunch title",
                Amount = 10,
                Date = new DateTime(2026, 7, 10),
                CategoryId = 1,
                UserId = "user-1"
            },
            new Expense
            {
                Id = 2,
                Title = "Other user's private purchase",
                Amount = 987654.32m,
                Date = new DateTime(2026, 7, 11),
                CategoryId = 2,
                UserId = "user-2"
            });
        await context.SaveChangesAsync();

        var handler = new CapturingHandler();
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://example.test/v1beta/") };
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(value => value.CreateClient("Gemini")).Returns(client);
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, "user-1")],
            "Test"));
        var controller = CreateController(context, factory.Object, principal);
        using var request = JsonDocument.Parse("{\"month\":7,\"year\":2026,\"expenses\":[{\"amount\":999999999}]}");

        var result = await controller.Analyze(request.RootElement, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(handler.RequestBody);
        Assert.Contains("Food", handler.RequestBody, StringComparison.Ordinal);
        Assert.DoesNotContain("confidential lunch", handler.RequestBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Other user's", handler.RequestBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("987654.32", handler.RequestBody, StringComparison.Ordinal);
        Assert.DoesNotContain("999999999", handler.RequestBody, StringComparison.Ordinal);
    }

    private static InsightsController CreateController(
        ApplicationDbContext context,
        IHttpClientFactory factory,
        ClaimsPrincipal user)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Gemini:ApiKey"] = "TEST_ONLY_NOT_A_REAL_API_KEY",
                ["Gemini:Model"] = "test-model"
            })
            .Build();

        return new InsightsController(context, factory, configuration)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            }
        };
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public string? RequestBody { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestBody = request.Content == null
                ? null
                : await request.Content.ReadAsStringAsync(cancellationToken);

            const string responseBody = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"insights\\\":[\\\"ok\\\"],\\\"warnings\\\":[],\\\"tips\\\":[]}\"}]}}]}";
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseBody, Encoding.UTF8, "application/json")
            };
        }
    }
}
