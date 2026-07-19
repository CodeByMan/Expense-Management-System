using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace ExpenseManagement.API.Hubs
{
    public class CustomUserIdProvider : IUserIdProvider
    {
        public string? GetUserId(HubConnectionContext connection)
        {
            var user = connection.User;

            return user?.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? user?.FindFirstValue("sub")
                   ?? user?.FindFirstValue("oid");
        }
    }
}