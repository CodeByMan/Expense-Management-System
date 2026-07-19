using ExpenseManagement.API.Contracts;
using ExpenseManagement.API.Data;
using ExpenseManagement.API.DTOs.Expense;
using ExpenseManagement.API.Hubs;
using ExpenseManagement.API.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

public class ExpenseRepository : IExpenseRepository
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ICategoryBudgetRepository _budgetRepository;

    public ExpenseRepository(
        ApplicationDbContext context,
        IHubContext<NotificationHub> hubContext,
        ICategoryBudgetRepository budgetRepository)
    {
        _context = context;
        _hubContext = hubContext;
        _budgetRepository = budgetRepository;
    }

    public async Task<IEnumerable<ExpenseDto>> GetAllExpenses(string userId)
    {
        return await _context.Expenses
            .Where(e => e.UserId == userId && !e.IsDelete)
            .Include(e => e.Category)
            .Select(e => new ExpenseDto
            {
                Id = e.Id,
                Title = e.Title,
                Amount = e.Amount,
                CategoryId = e.CategoryId,
                CategoryName = e.Category.CategoryName,
                Date = e.Date
            }).ToListAsync();
    }

    public async Task<ExpenseDto> GetExpenseById(int id, string userId)
    {
        var e = await _context.Expenses
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId && !x.IsDelete);

        if (e == null) return null;

        return new ExpenseDto
        {
            Id = e.Id,
            Title = e.Title,
            Amount = e.Amount,
            CategoryId = e.CategoryId,
            CategoryName = e.Category.CategoryName,
            Date = e.Date
        };
    }

    public async Task<ExpenseDto> AddExpense(CreateExpenseDto dto, string userId)
    {
        if (!await _context.Categories.AnyAsync(category => category.Id == dto.CategoryId && category.UserId == userId && !category.IsDelete))
            throw new ValidationException("Selected category is invalid.");

        var expense = new Expense
        {
            Title = dto.Title.Trim(),
            Amount = dto.Amount,
            CategoryId = dto.CategoryId,
            Date = dto.Date,
            UserId = userId
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        // Check monthly budget for the month the expense belongs to
        await _budgetRepository.CheckAndNotifyMonthlyBudget(
            dto.CategoryId, dto.Date.Month, dto.Date.Year, userId);

        return new ExpenseDto
        {
            Id = expense.Id,
            Title = expense.Title,
            Amount = expense.Amount,
            CategoryName = await _context.Categories.Where(category => category.Id == dto.CategoryId && category.UserId == userId).Select(category => category.CategoryName).FirstAsync(),
            Date = expense.Date
        };
    }

    public async Task<bool> UpdateExpense(int id, CreateExpenseDto dto, string userId)
    {
        var expense = await _context.Expenses
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId && !e.IsDelete);

        if (expense == null) return false;

        if (!await _context.Categories.AnyAsync(category => category.Id == dto.CategoryId && category.UserId == userId && !category.IsDelete))
            throw new ValidationException("Selected category is invalid.");

        expense.Title = dto.Title.Trim();
        expense.Amount = dto.Amount;
        expense.CategoryId = dto.CategoryId;
        expense.Date = dto.Date;
        expense.UpdatedAt = DateTime.UtcNow;

        _context.Expenses.Update(expense);
        await _context.SaveChangesAsync();

        // Re-check budget for the expense's month
        await _budgetRepository.CheckAndNotifyMonthlyBudget(
            dto.CategoryId, dto.Date.Month, dto.Date.Year, userId);

        return true;
    }

    public async Task<bool> DeleteExpense(int id, string userId)
    {
        var expense = await _context.Expenses
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId && !e.IsDelete);

        if (expense == null) return false;

        expense.IsDelete = true;
        await _context.SaveChangesAsync();
        return true;
    }
}
