using ExpenseManagement.API.Contracts;
using ExpenseManagement.API.DTOs.RecurringExpense;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ExpenseManagement.API.Helper;

namespace ExpenseManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RecurringExpensesController : ControllerBase
    {
        private readonly IRecurringExpenseRepository _repository;

        public RecurringExpensesController(IRecurringExpenseRepository repository)
        {
            _repository = repository;
        }

        private string UserId => User.GetUserId()!;

        // GET api/recurringexpenses
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _repository.GetAll(UserId);
            return Ok(items);
        }

        // GET api/recurringexpenses/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _repository.GetById(id, UserId);
            if (item == null) return NotFound();
            return Ok(item);
        }

        // POST api/recurringexpenses
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRecurringExpenseDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _repository.Create(dto, UserId);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        // PUT api/recurringexpenses/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateRecurringExpenseDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var success = await _repository.Update(id, dto, UserId);
            if (!success) return NotFound();
            return NoContent();
        }

        // PATCH api/recurringexpenses/5/toggle
        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var success = await _repository.ToggleActive(id, UserId);
            if (!success) return NotFound();
            return NoContent();
        }

        // DELETE api/recurringexpenses/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _repository.Delete(id, UserId);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
