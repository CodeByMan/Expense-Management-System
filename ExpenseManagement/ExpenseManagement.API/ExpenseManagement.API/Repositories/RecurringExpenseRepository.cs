using ExpenseManagement.API.Contracts;
using ExpenseManagement.API.Data;
using ExpenseManagement.API.DTOs.RecurringExpense;
using ExpenseManagement.API.Hubs;
using ExpenseManagement.API.Models;
using ExpenseManagement.API.Resources;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Localization;
using System.ComponentModel.DataAnnotations;
using System.Data;

namespace ExpenseManagement.API.Repositories
{
    public class RecurringExpenseRepository : IRecurringExpenseRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IStringLocalizer<SharedResource> _localizer;

        public RecurringExpenseRepository(
            ApplicationDbContext context,
            IHubContext<NotificationHub> hubContext,
            IStringLocalizer<SharedResource> localizer)
        {
            _context = context;
            _hubContext = hubContext;
            _localizer = localizer;
        }

        public async Task<IEnumerable<RecurringExpenseDto>> GetAll(string userId)
        {
            var recurringExpenses = await _context.RecurringExpenses
                .Where(item => item.UserId == userId && !item.IsDelete)
                .Include(item => item.Category)
                .ToListAsync();

            return recurringExpenses.Select(ToDto);
        }

        public async Task<RecurringExpenseDto?> GetById(int id, string userId)
        {
            var recurring = await _context.RecurringExpenses
                .Include(item => item.Category)
                .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId && !item.IsDelete);

            return recurring == null ? null : ToDto(recurring);
        }

        public async Task<RecurringExpenseDto> Create(CreateRecurringExpenseDto dto, string userId)
        {
            await EnsureOwnedCategory(dto.CategoryId, userId);
            var recurring = new RecurringExpense
            {
                Title = dto.Title.Trim(),
                Amount = dto.Amount,
                Interval = dto.Interval,
                DayOfPeriod = dto.DayOfPeriod,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                LastProcessed = dto.StartDate.AddTicks(-1),
                NextDue = dto.StartDate,
                CategoryId = dto.CategoryId,
                UserId = userId
            };

            _context.RecurringExpenses.Add(recurring);
            await _context.SaveChangesAsync();
            await _context.Entry(recurring).Reference(item => item.Category).LoadAsync();
            return ToDto(recurring);
        }

        public async Task<bool> Update(int id, UpdateRecurringExpenseDto dto, string userId)
        {
            var recurring = await _context.RecurringExpenses
                .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId && !item.IsDelete);

            if (recurring == null)
                return false;

            await EnsureOwnedCategory(dto.CategoryId, userId);
            recurring.Title = dto.Title.Trim();
            recurring.Amount = dto.Amount;
            recurring.Interval = dto.Interval;
            recurring.DayOfPeriod = dto.DayOfPeriod;
            recurring.StartDate = dto.StartDate;
            recurring.EndDate = dto.EndDate;
            recurring.IsActive = dto.IsActive;
            recurring.NextDue = dto.StartDate > DateTime.UtcNow
                ? dto.StartDate
                : CalculateNextDue(DateTime.UtcNow, dto.Interval, dto.DayOfPeriod);
            recurring.CategoryId = dto.CategoryId;
            recurring.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> Delete(int id, string userId)
        {
            var recurring = await _context.RecurringExpenses
                .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId && !item.IsDelete);

            if (recurring == null)
                return false;

            recurring.IsDelete = true;
            recurring.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleActive(int id, string userId)
        {
            var recurring = await _context.RecurringExpenses
                .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId && !item.IsDelete);

            if (recurring == null)
                return false;

            recurring.IsActive = !recurring.IsActive;
            recurring.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task ProcessDueRecurringExpenses(CancellationToken cancellationToken = default)
        {
            IDbContextTransaction? transaction = null;
            if (_context.Database.IsRelational())
            {
                transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

                if (_context.Database.IsSqlServer())
                {
                    await _context.Database.ExecuteSqlRawAsync(
                        """
                        DECLARE @LockResult int;
                        EXEC @LockResult = sys.sp_getapplock
                            @Resource = N'ExpenseManagement.RecurringExpenseProcessing',
                            @LockMode = N'Exclusive',
                            @LockOwner = N'Transaction',
                            @LockTimeout = 0;
                        IF @LockResult < 0
                            THROW 51000, 'Recurring expense processing is already running.', 1;
                        """,
                        cancellationToken);
                }
            }

            var notifications = new List<(string UserId, string Message)>();
            try
            {
                var now = DateTime.UtcNow;
                var dueItems = await _context.RecurringExpenses
                    .Include(item => item.Category)
                    .Where(item => item.IsActive && !item.IsDelete && item.NextDue <= now && (item.EndDate == null || item.EndDate >= item.NextDue))
                    .ToListAsync(cancellationToken);

                foreach (var item in dueItems)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var alreadyCreated = await _context.Expenses.AnyAsync(expense =>
                        expense.UserId == item.UserId &&
                        expense.CategoryId == item.CategoryId &&
                        expense.Title == item.Title &&
                        expense.Amount == item.Amount &&
                        expense.Date == item.NextDue,
                        cancellationToken);

                    if (!alreadyCreated)
                    {
                        _context.Expenses.Add(new Expense
                        {
                            Title = item.Title,
                            Amount = item.Amount,
                            CategoryId = item.CategoryId,
                            Date = item.NextDue,
                            UserId = item.UserId
                        });

                        notifications.Add((item.UserId, string.Format(
                            _localizer["notif_recurring_added"],
                            item.Title,
                            $"{item.Amount:0.00}")));
                    }

                    item.LastProcessed = item.NextDue;
                    item.NextDue = CalculateNextDue(item.NextDue, item.Interval, item.DayOfPeriod);
                }

                if (dueItems.Count > 0)
                    await _context.SaveChangesAsync(cancellationToken);

                if (transaction != null)
                    await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                if (transaction != null)
                    await transaction.RollbackAsync(cancellationToken);
                throw;
            }
            finally
            {
                if (transaction != null)
                    await transaction.DisposeAsync();
            }

            foreach (var notification in notifications)
            {
                await _hubContext.Clients.User(notification.UserId)
                    .SendAsync("ReceiveNotification", notification.Message, cancellationToken);
            }
        }

        private async Task EnsureOwnedCategory(int categoryId, string userId)
        {
            if (!await _context.Categories.AnyAsync(category => category.Id == categoryId && category.UserId == userId && !category.IsDelete))
                throw new ValidationException("Selected category is invalid.");
        }

        private static RecurringExpenseDto ToDto(RecurringExpense item)
        {
            return new RecurringExpenseDto
            {
                Id = item.Id,
                Title = item.Title,
                Amount = item.Amount,
                Interval = item.Interval.ToString(),
                DayOfPeriod = item.DayOfPeriod,
                StartDate = item.StartDate,
                EndDate = item.EndDate,
                NextDue = item.NextDue,
                IsActive = item.IsActive,
                CategoryId = item.CategoryId,
                CategoryName = item.Category?.CategoryName ?? string.Empty
            };
        }

        private static DateTime CalculateNextDue(DateTime from, RecurrenceInterval interval, int dayOfPeriod)
        {
            return interval switch
            {
                RecurrenceInterval.Daily => from.AddDays(1),
                RecurrenceInterval.Weekly => from.AddDays(7),
                RecurrenceInterval.Monthly => CalculateNextMonthlyDue(from, dayOfPeriod),
                RecurrenceInterval.Yearly => from.AddYears(1),
                _ => from.AddMonths(1)
            };
        }

        private static DateTime CalculateNextMonthlyDue(DateTime from, int dayOfPeriod)
        {
            var nextMonth = from.AddMonths(1);
            return new DateTime(
                nextMonth.Year,
                nextMonth.Month,
                Math.Min(dayOfPeriod, DateTime.DaysInMonth(nextMonth.Year, nextMonth.Month)),
                from.Hour,
                from.Minute,
                from.Second,
                from.Kind);
        }
    }
}
