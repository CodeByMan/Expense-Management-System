using ExpenseManagement.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpenseManagement.API.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260719123000_AddSqlStarterDataProcedure")]
    public partial class AddSqlStarterDataProcedure : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE OR ALTER PROCEDURE dbo.SeedExpenseManagementStarterData
                    @UserId nvarchar(450)
                AS
                BEGIN
                    SET NOCOUNT ON;
                    SET XACT_ABORT ON;

                    IF @UserId IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.AspNetUsers WHERE Id = @UserId)
                        RETURN;

                    IF EXISTS (SELECT 1 FROM dbo.Categories WHERE UserId = @UserId AND IsDelete = 0)
                        RETURN;

                    BEGIN TRY
                        BEGIN TRANSACTION;

                        DECLARE @Now datetime2 = SYSUTCDATETIME();
                        DECLARE @Today date = CAST(@Now AS date);
                        DECLARE @MonthStart date = DATEFROMPARTS(YEAR(@Now), MONTH(@Now), 1);
                        DECLARE @LastMonthStart date = DATEADD(month, -1, @MonthStart);

                        DECLARE @Groceries int, @Transport int, @Utilities int, @Rent int;
                        DECLARE @Dining int, @Health int, @Education int, @Shopping int;

                        INSERT dbo.Categories (CategoryName, CategoryDescription, Icon, Color, CreatedAt, UpdatedAt, IsDelete, UserId)
                        VALUES (N'Groceries', N'Food, household essentials and supermarket purchases', N'🛒', N'#10B981', @Now, @Now, 0, @UserId);
                        SET @Groceries = CONVERT(int, SCOPE_IDENTITY());

                        INSERT dbo.Categories (CategoryName, CategoryDescription, Icon, Color, CreatedAt, UpdatedAt, IsDelete, UserId)
                        VALUES (N'Transport', N'Fuel, ride-hailing, bus and commuting costs', N'🚗', N'#3B82F6', @Now, @Now, 0, @UserId);
                        SET @Transport = CONVERT(int, SCOPE_IDENTITY());

                        INSERT dbo.Categories (CategoryName, CategoryDescription, Icon, Color, CreatedAt, UpdatedAt, IsDelete, UserId)
                        VALUES (N'Utilities', N'Electricity, gas, water, internet and mobile bills', N'💡', N'#F59E0B', @Now, @Now, 0, @UserId);
                        SET @Utilities = CONVERT(int, SCOPE_IDENTITY());

                        INSERT dbo.Categories (CategoryName, CategoryDescription, Icon, Color, CreatedAt, UpdatedAt, IsDelete, UserId)
                        VALUES (N'Rent', N'Monthly rent and home-related payments', N'🏠', N'#8B5CF6', @Now, @Now, 0, @UserId);
                        SET @Rent = CONVERT(int, SCOPE_IDENTITY());

                        INSERT dbo.Categories (CategoryName, CategoryDescription, Icon, Color, CreatedAt, UpdatedAt, IsDelete, UserId)
                        VALUES (N'Dining', N'Restaurants, takeaway, tea and snacks', N'🍽️', N'#EF4444', @Now, @Now, 0, @UserId);
                        SET @Dining = CONVERT(int, SCOPE_IDENTITY());

                        INSERT dbo.Categories (CategoryName, CategoryDescription, Icon, Color, CreatedAt, UpdatedAt, IsDelete, UserId)
                        VALUES (N'Health', N'Medicines, doctor visits and wellbeing', N'🩺', N'#EC4899', @Now, @Now, 0, @UserId);
                        SET @Health = CONVERT(int, SCOPE_IDENTITY());

                        INSERT dbo.Categories (CategoryName, CategoryDescription, Icon, Color, CreatedAt, UpdatedAt, IsDelete, UserId)
                        VALUES (N'Education', N'Courses, books, certifications and learning', N'📚', N'#06B6D4', @Now, @Now, 0, @UserId);
                        SET @Education = CONVERT(int, SCOPE_IDENTITY());

                        INSERT dbo.Categories (CategoryName, CategoryDescription, Icon, Color, CreatedAt, UpdatedAt, IsDelete, UserId)
                        VALUES (N'Shopping', N'Clothing, electronics and personal purchases', N'🛍️', N'#F97316', @Now, @Now, 0, @UserId);
                        SET @Shopping = CONVERT(int, SCOPE_IDENTITY());

                        INSERT dbo.CategoryBudgets (Month, Year, Amount, CreatedAt, UpdatedAt, CategoryId, UserId)
                        VALUES
                            (MONTH(@Now), YEAR(@Now), 30000, @Now, @Now, @Groceries, @UserId),
                            (MONTH(@Now), YEAR(@Now), 15000, @Now, @Now, @Transport, @UserId),
                            (MONTH(@Now), YEAR(@Now), 18000, @Now, @Now, @Utilities, @UserId),
                            (MONTH(@Now), YEAR(@Now), 45000, @Now, @Now, @Rent, @UserId),
                            (MONTH(@Now), YEAR(@Now), 12000, @Now, @Now, @Dining, @UserId),
                            (MONTH(@Now), YEAR(@Now), 10000, @Now, @Now, @Health, @UserId),
                            (MONTH(@Now), YEAR(@Now), 12000, @Now, @Now, @Education, @UserId),
                            (MONTH(@Now), YEAR(@Now), 15000, @Now, @Now, @Shopping, @UserId);

                        INSERT dbo.Expenses (Title, Amount, Date, CreatedAt, UpdatedAt, IsDelete, CategoryId, UserId)
                        VALUES
                            (N'Monthly house rent', 45000, DATEADD(day, 0, @MonthStart), @Now, @Now, 0, @Rent, @UserId),
                            (N'Weekly groceries', 6850, DATEADD(day, CASE WHEN DAY(@Today) > 5 THEN -5 ELSE 0 END, @Today), @Now, @Now, 0, @Groceries, @UserId),
                            (N'Electricity bill', 9200, DATEADD(day, CASE WHEN DAY(@Today) > 8 THEN -8 ELSE 0 END, @Today), @Now, @Now, 0, @Utilities, @UserId),
                            (N'Internet package', 3200, DATEADD(day, CASE WHEN DAY(@Today) > 3 THEN -3 ELSE 0 END, @Today), @Now, @Now, 0, @Utilities, @UserId),
                            (N'Fuel refill', 5000, DATEADD(day, CASE WHEN DAY(@Today) > 4 THEN -4 ELSE 0 END, @Today), @Now, @Now, 0, @Transport, @UserId),
                            (N'Family dinner', 4200, DATEADD(day, CASE WHEN DAY(@Today) > 2 THEN -2 ELSE 0 END, @Today), @Now, @Now, 0, @Dining, @UserId),
                            (N'Online development course', 7500, DATEADD(day, CASE WHEN DAY(@Today) > 10 THEN -10 ELSE 0 END, @Today), @Now, @Now, 0, @Education, @UserId),
                            (N'Pharmacy purchase', 1800, DATEADD(day, CASE WHEN DAY(@Today) > 1 THEN -1 ELSE 0 END, @Today), @Now, @Now, 0, @Health, @UserId),
                            (N'Last month rent', 45000, DATEADD(day, 1, @LastMonthStart), @Now, @Now, 0, @Rent, @UserId),
                            (N'Last month groceries', 11900, DATEADD(day, 7, @LastMonthStart), @Now, @Now, 0, @Groceries, @UserId),
                            (N'Last month transport', 7200, DATEADD(day, 12, @LastMonthStart), @Now, @Now, 0, @Transport, @UserId),
                            (N'Last month utilities', 10600, DATEADD(day, 18, @LastMonthStart), @Now, @Now, 0, @Utilities, @UserId),
                            (N'Previous month spending', 8400, DATEADD(month, -2, DATEADD(day, 9, @MonthStart)), @Now, @Now, 0, @Shopping, @UserId),
                            (N'Quarterly learning expense', 6200, DATEADD(month, -3, DATEADD(day, 11, @MonthStart)), @Now, @Now, 0, @Education, @UserId),
                            (N'Previous health expense', 3900, DATEADD(month, -4, DATEADD(day, 13, @MonthStart)), @Now, @Now, 0, @Health, @UserId),
                            (N'Previous dining expense', 5100, DATEADD(month, -5, DATEADD(day, 15, @MonthStart)), @Now, @Now, 0, @Dining, @UserId);

                        INSERT dbo.SavingsGoals (Name, Target, Saved, Color, IsDelete, CreatedAt, UpdatedAt, UserId)
                        VALUES
                            (N'Emergency Fund', 300000, 75000, N'#10B981', 0, @Now, NULL, @UserId),
                            (N'New Laptop', 200000, 35000, N'#3B82F6', 0, @Now, NULL, @UserId);

                        INSERT dbo.RecurringExpenses
                            (Title, Amount, Interval, DayOfPeriod, StartDate, EndDate, LastProcessed, NextDue, IsActive, IsDelete, CreatedAt, UpdatedAt, CategoryId, UserId)
                        VALUES
                            (N'Monthly Rent', 45000, 2, 1, @MonthStart, NULL, @Now, DATEADD(month, 1, @MonthStart), 1, 0, @Now, NULL, @Rent, @UserId),
                            (N'Internet Bill', 3200, 2, 10, DATEADD(day, 9, @MonthStart), NULL, @Now, DATEADD(month, 1, DATEADD(day, 9, @MonthStart)), 1, 0, @Now, NULL, @Utilities, @UserId);

                        COMMIT TRANSACTION;
                    END TRY
                    BEGIN CATCH
                        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
                        THROW;
                    END CATCH
                END
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS dbo.SeedExpenseManagementStarterData;");
        }
    }
}
