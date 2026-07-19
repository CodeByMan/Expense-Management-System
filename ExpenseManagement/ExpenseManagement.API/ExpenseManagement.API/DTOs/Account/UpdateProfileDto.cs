using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.DTOs.Account
{
    public class UpdateProfileDto
    {
        [Required, StringLength(50, MinimumLength = 2)]
        public string FirstName { get; set; } = string.Empty;

        [Required, StringLength(50, MinimumLength = 2)]
        public string LastName { get; set; } = string.Empty;
    }
}
