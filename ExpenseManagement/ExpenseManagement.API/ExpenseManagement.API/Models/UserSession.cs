namespace ExpenseManagement.API.Models
{
    public class UserSession
    {
        public int Id { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string DeviceInfo { get; set; } = string.Empty;
        public string Browser { get; set; } = string.Empty;
        public string OS { get; set; } = string.Empty;
        public DateTime LoginAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastActiveAt { get; set; }
        public bool IsActive { get; set; } = true;

        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;
    }
}
