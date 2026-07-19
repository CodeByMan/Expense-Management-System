using ExpenseManagement.API.Contracts;
using ExpenseManagement.API.DTOs.SavingsGoal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ExpenseManagement.API.Helper;

namespace ExpenseManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SavingsGoalsController : ControllerBase
    {
        private readonly ISavingsGoalRepository _repository;

        public SavingsGoalsController(ISavingsGoalRepository repository)
        {
            _repository = repository;
        }

        private string UserId => User.GetUserId()!;

        // GET api/savingsgoals
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var goals = await _repository.GetAllGoals(UserId);
            return Ok(goals);
        }

        // GET api/savingsgoals/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var goal = await _repository.GetGoalById(id, UserId);
            if (goal == null) return NotFound();
            return Ok(goal);
        }

        // POST api/savingsgoals
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSavingsGoalDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var goal = await _repository.AddGoal(dto, UserId);
            return CreatedAtAction(nameof(GetById), new { id = goal.Id }, goal);
        }

        // PUT api/savingsgoals/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateSavingsGoalDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var success = await _repository.UpdateGoal(id, dto, UserId);
            if (!success) return NotFound();
            return NoContent();
        }

        // PATCH api/savingsgoals/5/saved
        [HttpPatch("{id}/saved")]
        public async Task<IActionResult> UpdateSaved(int id, [FromBody] UpdateSavedAmountDto dto)
        {
            var success = await _repository.UpdateSavedAmount(id, dto, UserId);
            if (!success) return NotFound();
            return NoContent();
        }

        // DELETE api/savingsgoals/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _repository.DeleteGoal(id, UserId);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
