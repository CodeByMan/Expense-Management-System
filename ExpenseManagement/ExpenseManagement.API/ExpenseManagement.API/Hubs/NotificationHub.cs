using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ExpenseManagement.API.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
    }
}
