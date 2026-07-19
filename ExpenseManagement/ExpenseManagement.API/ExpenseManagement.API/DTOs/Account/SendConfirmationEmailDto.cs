using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.DTOs.Account
{
    public class SendConfirmationEmailDto
    {
        [Required, EmailAddress, StringLength(254)]
        public string Email { get; set; } = string.Empty;
    }
}
