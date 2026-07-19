using AutoMapper;
using ExpenseManagement.API.Contracts;
using ExpenseManagement.API.DTOs.category;
using ExpenseManagement.API.Helper;
using ExpenseManagement.API.Models;
using ExpenseManagement.API.Resources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

namespace ExpenseManagement.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly IMapper _mapper;
        private readonly IStringLocalizer<SharedResource> _localizer;

        public CategoryController(
            ICategoryRepository categoryRepository,
            IMapper mapper,
            IStringLocalizer<SharedResource> localizer)
        {
            _categoryRepository = categoryRepository;
            _mapper             = mapper;
            _localizer          = localizer;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId     = User.GetUserId();
            var categories = await _categoryRepository.GetAllAsync(userId);
            var mapped = _mapper.Map<IEnumerable<CategoryDto>>(categories ?? []);
            return Ok(new ApiResponse<IEnumerable<CategoryDto>>(true, _localizer["categories_retrieved"], mapped));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId   = User.GetUserId();
            var category = await _categoryRepository.GetByIdAsync(id, userId);
            if (category == null)
                return NotFound(new ApiResponse<object>(false, _localizer["category_not_found"], null));

            var mapped = _mapper.Map<CategoryDto>(category);
            return Ok(new ApiResponse<CategoryDto>(true, _localizer["category_retrieved"], mapped));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCategoryDto createCategoryDto)
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized();

            var category = _mapper.Map<Category>(createCategoryDto);
            category.UserId = userId;

            var result = await _categoryRepository.AddAsync(category);
            if (!result)
                return BadRequest(new ApiResponse<object>(false, _localizer["category_create_failed"], null));

            var mapped = _mapper.Map<CategoryDto>(category);
            return Ok(new ApiResponse<CategoryDto>(true, _localizer["category_created"], mapped));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId    = User.GetUserId();
            var isDeleted = await _categoryRepository.DeleteAsync(id, userId);
            if (!isDeleted)
                return BadRequest(new ApiResponse<object>(false, _localizer["category_delete_failed"], null));

            return Ok(new ApiResponse<object>(true, _localizer["category_deleted"], null));
        }

        [HttpPut("Update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryDto updateDto)
        {
            var userId    = User.GetUserId();
            var isUpdated = await _categoryRepository.UpdateAsync(id, updateDto, userId);
            if (!isUpdated)
                return BadRequest(new ApiResponse<object>(false, _localizer["category_update_failed"], null));

            return Ok(new ApiResponse<object>(true, _localizer["category_updated"], null));
        }
    }
}
