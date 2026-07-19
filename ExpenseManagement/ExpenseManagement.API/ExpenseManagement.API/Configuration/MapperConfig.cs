using AutoMapper;
using ExpenseManagement.API.DTOs.category;
using ExpenseManagement.API.Models;

namespace ExpenseManagement.API.Configuration
{
    public class MapperConfig:Profile
    {
        public MapperConfig()
        {
            CreateMap<Category, CategoryDto>();

            CreateMap<CreateCategoryDto, Category>();

            CreateMap<UpdateCategoryDto, Category>();
        }
    }
}
