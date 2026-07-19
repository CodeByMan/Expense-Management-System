namespace ExpenseManagement.API.DTOs.Dashboard
{
    public class AlertDto
    {
        // "warning" | "success" | "info" | "danger"
        public string Type { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
