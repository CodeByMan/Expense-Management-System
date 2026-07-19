using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ExpenseManagement.API.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? ProfileImageUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public ICollection<Category> Categories { get; set; }
        public ICollection<Expense> Expenses { get; set; }
        public List<RefreshToken> RefreshTokens { get; set; } 
    }
}
