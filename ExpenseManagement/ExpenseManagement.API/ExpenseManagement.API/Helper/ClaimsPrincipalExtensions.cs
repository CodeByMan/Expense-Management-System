using System.Security.Claims;

namespace ExpenseManagement.API.Helper
{
    public static class ClaimsPrincipalExtensions
    {
        public static string? GetUserId(this ClaimsPrincipal user)
        {
            if (user == null)
            {
                throw new ArgumentNullException(nameof(user));
            }
            //return user.FindFirst("uid")?.Value;
            return user.FindFirstValue(ClaimTypes.NameIdentifier)
              ?? user.FindFirstValue("sub")
              ?? user.FindFirstValue("oid");
        }
    }
}
