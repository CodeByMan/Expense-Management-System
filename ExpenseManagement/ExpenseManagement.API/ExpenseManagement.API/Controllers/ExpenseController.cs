using AutoMapper;
using ExpenseManagement.API.Contracts;
using ExpenseManagement.API.DTOs.Expense;
using ExpenseManagement.API.Helper;
using ExpenseManagement.API.Models;
using ExpenseManagement.API.Resources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

namespace ExpenseManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ExpenseController : ControllerBase
    {
        private readonly IExpenseRepository _expenseRepository;
        private readonly IMapper _mapper;
        private readonly IStringLocalizer<SharedResource> _localizer;

        public ExpenseController(
            IExpenseRepository expenseRepository,
            IMapper mapper,
            IStringLocalizer<SharedResource> localizer)
        {
            _expenseRepository = expenseRepository;
            _mapper            = mapper;
            _localizer         = localizer;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId   = User.GetUserId();
            var expenses = await _expenseRepository.GetAllExpenses(userId);
            return Ok(new ApiResponse<object>(true, _localizer["expenses_retrieved"], expenses));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId  = User.GetUserId();
            var expense = await _expenseRepository.GetExpenseById(id, userId);
            if (expense == null)
                return NotFound(new ApiResponse<object>(false, _localizer["expense_not_found"], null));

            return Ok(new ApiResponse<object>(true, _localizer["expense_retrieved"], expense));
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateExpenseDto dto)
        {
            var userId = User.GetUserId();
            var result = await _expenseRepository.AddExpense(dto, userId);
            return Ok(new ApiResponse<object>(true, _localizer["expense_created"], result));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, CreateExpenseDto dto)
        {
            var userId  = User.GetUserId();
            var updated = await _expenseRepository.UpdateExpense(id, dto, userId);
            if (!updated)
                return NotFound(new ApiResponse<object>(false, _localizer["expense_not_found"], null));

            return Ok(new ApiResponse<object>(true, _localizer["expense_updated"], null));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId  = User.GetUserId();
            var deleted = await _expenseRepository.DeleteExpense(id, userId);
            if (!deleted)
                return NotFound(new ApiResponse<object>(false, _localizer["expense_not_found"], null));

            return Ok(new ApiResponse<object>(true, _localizer["expense_deleted"], null));
        }
    }
}
