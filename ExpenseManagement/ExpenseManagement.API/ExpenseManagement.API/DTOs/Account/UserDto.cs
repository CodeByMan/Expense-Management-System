using System.Text.Json.Serialization;

namespace ExpenseManagement.API.DTOs.Account
{
    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;

        [JsonIgnore]
        public string RefreshToken { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public DateTime ExpiresOn { get; set; }
        public bool Is2FactorRequired { get; set; }
        public string? Provider { get; set; }
    }
}
