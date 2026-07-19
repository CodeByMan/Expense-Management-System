using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpenseManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class addAmountToCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Amount",
                table: "Categories",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Amount",
                table: "Categories");
        }
    }
}
