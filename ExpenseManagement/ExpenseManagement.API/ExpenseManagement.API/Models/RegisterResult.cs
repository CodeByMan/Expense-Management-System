namespace ExpenseManagement.API.Models
{
    public record RegisterResult(
      bool Success,
      string Message,
      bool EmailSent
  );
}
