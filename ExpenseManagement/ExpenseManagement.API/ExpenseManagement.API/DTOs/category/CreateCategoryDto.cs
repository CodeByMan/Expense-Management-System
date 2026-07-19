using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.DTOs.category
{
    public class CreateCategoryDto
    {
        [Required, StringLength(80, MinimumLength = 1)]
        public string CategoryName { get; set; } = string.Empty;

        [StringLength(250)]
        public string CategoryDescription { get; set; } = string.Empty;

        [StringLength(20)]
        public string Icon { get; set; } = string.Empty;

        [StringLength(20)]
        public string Color { get; set; } = string.Empty;
    }
}
