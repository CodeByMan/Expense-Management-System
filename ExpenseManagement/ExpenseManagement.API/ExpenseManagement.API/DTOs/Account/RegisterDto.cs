using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.DTOs.Account
{
    public class RegisterDto
    {
        [Required, StringLength(50, MinimumLength = 1)]
        public string FirstName { get; set; } = string.Empty;

        [Required, StringLength(50, MinimumLength = 1)]
        public string LastName { get; set; } = string.Empty;

        [Required, EmailAddress, StringLength(254)]
        public string Email { get; set; } = string.Empty;

        [Required, StringLength(128, MinimumLength = 8)]
        public string Password { get; set; } = string.Empty;
    }
}
