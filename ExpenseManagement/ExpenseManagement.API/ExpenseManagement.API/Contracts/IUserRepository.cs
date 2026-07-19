using ExpenseManagement.API.DTOs.Account;
using ExpenseManagement.API.Models;

namespace ExpenseManagement.API.Contracts
{
    public interface IUserRepository
    {
        Task<RegisterResult> Registeration(RegisterDto registerDto);
        Task<UserDto> Login(string email, string password);
        Task<UserDto> RefreshToken(string token);
        Task<bool> Logout(string refreshToken, string userId);
        //Task<bool> RevokeToken(string token);
    }
}
