using ExpenseManagement.API.Data;
using ExpenseManagement.API.DTOs.Account;
using ExpenseManagement.API.Models;
using ExpenseManagement.API.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ExpenseManagement.API.Tests;

public class UserRepositoryTests
{
    [Fact]
    public async Task RegistrationCreatesUserAndAssignsExistingUserRole()
    {
        var manager = CreateUserManager();
        manager.Setup(value => value.FindByEmailAsync("new@example.com"))
            .ReturnsAsync((ApplicationUser?)null);
        manager.Setup(value => value.CreateAsync(It.IsAny<ApplicationUser>(), "Strong1!Password"))
            .ReturnsAsync(IdentityResult.Success);
        manager.Setup(value => value.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"))
            .ReturnsAsync(IdentityResult.Success);

        await using var context = CreateContext();
        var repository = new UserRepository(manager.Object, CreateConfiguration(), context);
        var result = await repository.Registeration(new RegisterDto
        {
            FirstName = "New",
            LastName = "User",
            Email = "new@example.com",
            Password = "Strong1!Password"
        });

        Assert.True(result.Success);
        manager.Verify(value => value.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"), Times.Once);
    }

    [Fact]
    public async Task InvalidPasswordIncrementsIdentityFailureCount()
    {
        var user = CreateUser();
        var manager = CreateUserManager();
        manager.Setup(value => value.FindByEmailAsync(user.Email!)).ReturnsAsync(user);
        manager.Setup(value => value.IsLockedOutAsync(user)).ReturnsAsync(false);
        manager.Setup(value => value.CheckPasswordAsync(user, "wrong-password")).ReturnsAsync(false);
        manager.Setup(value => value.AccessFailedAsync(user)).ReturnsAsync(IdentityResult.Success);

        await using var context = CreateContext();
        var repository = new UserRepository(manager.Object, CreateConfiguration(), context);

        Assert.Null(await repository.Login(user.Email!, "wrong-password"));
        manager.Verify(value => value.AccessFailedAsync(user), Times.Once);
    }

    [Fact]
    public async Task SuccessfulLoginIssuesClaimBoundJwtAndRefreshSession()
    {
        var user = CreateUser();
        var manager = CreateUserManagerForSuccessfulAuthentication(user);

        await using var context = CreateContext();
        var repository = new UserRepository(manager.Object, CreateConfiguration(), context);
        var result = await repository.Login(user.Email!, "Strong1!Password");

        Assert.NotNull(result);
        Assert.Equal(1, await context.RefreshTokens.CountAsync());

        var token = new JwtSecurityTokenHandler().ReadJwtToken(result!.Token);
        Assert.Equal(user.Id, token.Claims.Single(claim => claim.Type == ClaimTypes.NameIdentifier).Value);
        Assert.Equal("ExpenseManagement.API", token.Issuer);
        Assert.Contains("ExpenseManagement.Web", token.Audiences);
    }

    [Fact]
    public async Task RefreshRotatesAndRevokesTheSubmittedToken()
    {
        var user = CreateUser();
        var manager = CreateUserManager();
        manager.Setup(value => value.GetRolesAsync(user)).ReturnsAsync(["User"]);
        manager.Setup(value => value.GetSecurityStampAsync(user)).ReturnsAsync("security-stamp");

        await using var context = CreateContext();
        context.Users.Add(user);
        context.RefreshTokens.Add(new RefreshToken
        {
            Token = "existing-refresh-token",
            UserId = user.Id,
            User = user,
            CreatedOn = DateTime.UtcNow.AddMinutes(-1),
            ExpiresOn = DateTime.UtcNow.AddDays(1)
        });
        await context.SaveChangesAsync();

        var repository = new UserRepository(manager.Object, CreateConfiguration(), context);
        var result = await repository.RefreshToken("existing-refresh-token");

        Assert.NotNull(result);
        Assert.NotEqual("existing-refresh-token", result!.RefreshToken);
        Assert.NotNull((await context.RefreshTokens.SingleAsync(value => value.Token == "existing-refresh-token")).RevokedOn);
        Assert.Equal(2, await context.RefreshTokens.CountAsync());
    }

    private static Mock<UserManager<ApplicationUser>> CreateUserManager()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        return new Mock<UserManager<ApplicationUser>>(
            store.Object,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!);
    }

    private static Mock<UserManager<ApplicationUser>> CreateUserManagerForSuccessfulAuthentication(ApplicationUser user)
    {
        var manager = CreateUserManager();
        manager.Setup(value => value.FindByEmailAsync(user.Email!)).ReturnsAsync(user);
        manager.Setup(value => value.IsLockedOutAsync(user)).ReturnsAsync(false);
        manager.Setup(value => value.CheckPasswordAsync(user, "Strong1!Password")).ReturnsAsync(true);
        manager.Setup(value => value.ResetAccessFailedCountAsync(user)).ReturnsAsync(IdentityResult.Success);
        manager.Setup(value => value.GetRolesAsync(user)).ReturnsAsync(["User"]);
        manager.Setup(value => value.GetSecurityStampAsync(user)).ReturnsAsync("security-stamp");
        return manager;
    }

    private static ApplicationUser CreateUser() => new()
    {
        Id = "user-1",
        FirstName = "Portfolio",
        LastName = "User",
        UserName = "user@example.com",
        Email = "user@example.com",
        EmailConfirmed = true,
        SecurityStamp = "security-stamp"
    };

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static IConfiguration CreateConfiguration() => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "TEST_ONLY_JWT_SIGNING_KEY_32_BYTES_MINIMUM_12345",
            ["Jwt:Issuer"] = "ExpenseManagement.API",
            ["Jwt:Audience"] = "ExpenseManagement.Web"
        })
        .Build();
}
