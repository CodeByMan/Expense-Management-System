using ExpenseManagement.API.Contracts;
using ExpenseManagement.API.Data;
using ExpenseManagement.API.DTOs.SavingsGoal;
using ExpenseManagement.API.Hubs;
using ExpenseManagement.API.Models;
using ExpenseManagement.API.Resources;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace ExpenseManagement.API.Repositories
{
    public class SavingsGoalRepository : ISavingsGoalRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IStringLocalizer<SharedResource> _localizer;

        public SavingsGoalRepository(
            ApplicationDbContext context,
            IHubContext<NotificationHub> hubContext,
            IStringLocalizer<SharedResource> localizer)
        {
            _context = context;
            _hubContext = hubContext;
            _localizer = localizer;
        }

        public async Task<IEnumerable<SavingsGoalDto>> GetAllGoals(string userId)
        {
            return await _context.SavingsGoals
                .Where(g => g.UserId == userId && !g.IsDelete)
                .Select(g => new SavingsGoalDto
                {
                    Id = g.Id,
                    Name = g.Name,
                    Target = g.Target,
                    Saved = g.Saved,
                    Color = g.Color,
                })
                .ToListAsync();
        }

        public async Task<SavingsGoalDto?> GetGoalById(int id, string userId)
        {
            var g = await _context.SavingsGoals
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId && !x.IsDelete);

            if (g == null) return null;

            return new SavingsGoalDto
            {
                Id = g.Id,
                Name = g.Name,
                Target = g.Target,
                Saved = g.Saved,
                Color = g.Color,
            };
        }

        public async Task<SavingsGoalDto> AddGoal(CreateSavingsGoalDto dto, string userId)
        {
            var goal = new SavingsGoal
            {
                Name = dto.Name,
                Target = dto.Target,
                Saved = dto.Saved,
                Color = dto.Color,
                UserId = userId
            };

            _context.SavingsGoals.Add(goal);
            await _context.SaveChangesAsync();

            // Notify if goal is already partially/fully funded on creation
            await CheckAndNotifyGoalProgress(goal, userId);

            return new SavingsGoalDto
            {
                Id = goal.Id,
                Name = goal.Name,
                Target = goal.Target,
                Saved = goal.Saved,
                Color = goal.Color,
            };
        }

        public async Task<bool> UpdateGoal(int id, CreateSavingsGoalDto dto, string userId)
        {
            var goal = await _context.SavingsGoals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId && !g.IsDelete);

            if (goal == null) return false;

            goal.Name = dto.Name;
            goal.Target = dto.Target;
            goal.Saved = dto.Saved;
            goal.Color = dto.Color;
            goal.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            await CheckAndNotifyGoalProgress(goal, userId);

            return true;
        }

        public async Task<bool> UpdateSavedAmount(int id, UpdateSavedAmountDto dto, string userId)
        {
            var goal = await _context.SavingsGoals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId && !g.IsDelete);

            if (goal == null) return false;

            goal.Saved = Math.Clamp(dto.Saved, 0, goal.Target); // cap at target
            goal.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            await CheckAndNotifyGoalProgress(goal, userId);

            return true;
        }

        public async Task<bool> DeleteGoal(int id, string userId)
        {
            var goal = await _context.SavingsGoals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId && !g.IsDelete);

            if (goal == null) return false;

            goal.IsDelete = true;
            await _context.SaveChangesAsync();
            return true;
        }

        // ── SignalR notifications — same pattern as CheckAndNotifyBudget ──────────

        private async Task CheckAndNotifyGoalProgress(SavingsGoal goal, string userId)
        {
            if (goal.Target <= 0) return;

            var percentage = (goal.Saved / goal.Target) * 100;

            if (goal.Saved >= goal.Target)
            {
                await _hubContext.Clients.User(userId).SendAsync("ReceiveNotification",
                    string.Format(_localizer["notif_goal_completed"], goal.Name));
            }
            else if (percentage >= 75)
            {
                await _hubContext.Clients.User(userId).SendAsync("ReceiveNotification",
                    string.Format(_localizer["notif_goal_progress"],
                        $"{percentage:0}",
                        goal.Name));
            }
        }
    }
}
