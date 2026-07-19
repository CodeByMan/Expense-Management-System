using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.Models
{
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; } 
        public string Token { get; set; }
        public DateTime ExpiresOn { get; set; }
        public bool IsExpired => DateTime.UtcNow >= ExpiresOn;
        public DateTime CreatedOn { get; set; }
        public DateTime? RevokedOn { get; set; }
        public bool IsActive => RevokedOn == null && !IsExpired;

        public string UserId { get; set; }
        public ApplicationUser User { get; set; }

    }
}
