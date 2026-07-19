using ClosedXML.Excel;
using ExpenseManagement.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ExpenseManagement.API.Helper;

namespace ExpenseManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ExportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ExportController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string UserId => User.GetUserId()!;

        // ── GET api/export/pdf?month=4&year=2026 ─────────────────────────────

        [HttpGet("pdf")]
        public async Task<IActionResult> ExportPdf([FromQuery] int? month, [FromQuery] int? year)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var m = month ?? DateTime.UtcNow.Month;
            var y = year ?? DateTime.UtcNow.Year;
            if (m is < 1 or > 12 || y is < 2000 or > 2100)
                return BadRequest(new ProblemDetails { Title = "Invalid export range", Detail = "Month or year is outside the supported range." });

            var expenses = await GetExpensesForMonth(m, y);
            var budgets  = await GetBudgetsForMonth(m, y);
            var monthName = new DateTime(y, m, 1).ToString("MMMM yyyy");

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Column(col =>
                    {
                        col.Item().Text($"Expense Report — {monthName}")
                            .FontSize(20).SemiBold().FontColor(Colors.Blue.Medium);
                        col.Item().Text($"Generated {DateTime.UtcNow:dd MMM yyyy HH:mm} UTC")
                            .FontSize(9).FontColor(Colors.Grey.Medium);
                        col.Item().PaddingTop(4).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    });

                    page.Content().PaddingTop(16).Column(col =>
                    {
                        // ── Summary cards ─────────────────────────────────────
                        var total = expenses.Sum(e => e.Amount);
                        col.Item().Text("Summary").FontSize(13).SemiBold();
                        col.Item().PaddingTop(6).Row(row =>
                        {
                            SummaryCard(row, "Total spent", $"PKR {total:N2}");
                            SummaryCard(row, "Transactions", expenses.Count.ToString());
                            SummaryCard(row, "Categories", expenses.Select(e => e.CategoryName).Distinct().Count().ToString());
                        });

                        // ── Budget vs actual ──────────────────────────────────
                        if (budgets.Any())
                        {
                            col.Item().PaddingTop(16).Text("Budget vs. Actual").FontSize(13).SemiBold();
                            col.Item().PaddingTop(6).Table(table =>
                            {
                                table.ColumnsDefinition(cols =>
                                {
                                    cols.RelativeColumn(3);
                                    cols.RelativeColumn(2);
                                    cols.RelativeColumn(2);
                                    cols.RelativeColumn(2);
                                });

                                TableHeader(table, "Category", "Budget", "Spent", "Remaining");

                                foreach (var b in budgets)
                                {
                                    var spent = expenses.Where(e => e.CategoryName == b.CategoryName).Sum(e => e.Amount);
                                    var remaining = b.Amount - spent;
                                    var isOver = remaining < 0;

                                    table.Cell().Padding(4).Text(b.CategoryName);
                                    table.Cell().Padding(4).Text($"PKR {b.Amount:N2}");
                                    table.Cell().Padding(4).Text($"PKR {spent:N2}").FontColor(isOver ? Colors.Red.Medium : Colors.Black);
                                    table.Cell().Padding(4).Text(isOver ? $"-PKR {Math.Abs(remaining):N2}" : $"PKR {remaining:N2}")
                                        .FontColor(isOver ? Colors.Red.Medium : Colors.Green.Medium);
                                }
                            });
                        }

                        // ── Transactions ──────────────────────────────────────
                        col.Item().PaddingTop(16).Text("Transactions").FontSize(13).SemiBold();
                        col.Item().PaddingTop(6).Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(3);
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(2);
                            });

                            TableHeader(table, "Date", "Title", "Category", "Amount");

                            foreach (var e in expenses.OrderByDescending(x => x.Date))
                            {
                                table.Cell().Padding(4).Text(e.Date.ToString("dd MMM"));
                                table.Cell().Padding(4).Text(e.Title);
                                table.Cell().Padding(4).Text(e.CategoryName);
                                table.Cell().Padding(4).Text($"PKR {e.Amount:N2}");
                            }
                        });
                    });

                    page.Footer().AlignCenter()
                        .Text(x =>
                        {
                            x.Span("Page ").FontSize(9).FontColor(Colors.Grey.Medium);
                            x.CurrentPageNumber().FontSize(9).FontColor(Colors.Grey.Medium);
                            x.Span(" of ").FontSize(9).FontColor(Colors.Grey.Medium);
                            x.TotalPages().FontSize(9).FontColor(Colors.Grey.Medium);
                        });
                });
            });

            var bytes = pdf.GeneratePdf();
            return File(bytes, "application/pdf", $"expense-report-{m:00}-{y}.pdf");
        }

        // ── GET api/export/excel?month=4&year=2026 ────────────────────────────

        [HttpGet("excel")]
        public async Task<IActionResult> ExportExcel([FromQuery] int? month, [FromQuery] int? year)
        {
            var m = month ?? DateTime.UtcNow.Month;
            var y = year ?? DateTime.UtcNow.Year;
            if (m is < 1 or > 12 || y is < 2000 or > 2100)
                return BadRequest(new ProblemDetails { Title = "Invalid export range", Detail = "Month or year is outside the supported range." });

            var expenses  = await GetExpensesForMonth(m, y);
            var budgets   = await GetBudgetsForMonth(m, y);
            var monthName = new DateTime(y, m, 1).ToString("MMMM yyyy");

            using var wb = new XLWorkbook();

            // ── Sheet 1: Transactions ────────────────────────────────────────
            var ws = wb.Worksheets.Add("Transactions");
            ws.Cell(1, 1).Value = $"Expense Report — {monthName}";
            ws.Cell(1, 1).Style.Font.Bold = true;
            ws.Cell(1, 1).Style.Font.FontSize = 14;
            ws.Range(1, 1, 1, 4).Merge();

            var headers = new[] { "Date", "Title", "Category", "Amount" };
            for (int i = 0; i < headers.Length; i++)
            {
                ws.Cell(3, i + 1).Value = headers[i];
                ws.Cell(3, i + 1).Style.Font.Bold = true;
                ws.Cell(3, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#0058be");
                ws.Cell(3, i + 1).Style.Font.FontColor = XLColor.White;
            }

            int row = 4;
            foreach (var e in expenses.OrderByDescending(x => x.Date))
            {
                ws.Cell(row, 1).Value = e.Date.ToString("dd MMM yyyy");
                ws.Cell(row, 2).Value = e.Title;
                ws.Cell(row, 3).Value = e.CategoryName;
                ws.Cell(row, 4).Value = e.Amount;
                ws.Cell(row, 4).Style.NumberFormat.Format = "PKR #,##0.00";

                if (row % 2 == 0)
                    ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");

                row++;
            }

            ws.Cell(row, 3).Value = "Total";
            ws.Cell(row, 3).Style.Font.Bold = true;
            ws.Cell(row, 4).Value = expenses.Sum(e => e.Amount);
            ws.Cell(row, 4).Style.Font.Bold = true;
            ws.Cell(row, 4).Style.NumberFormat.Format = "PKR #,##0.00";

            ws.Columns().AdjustToContents();

            // ── Sheet 2: Budget vs Actual ────────────────────────────────────
            if (budgets.Any())
            {
                var ws2 = wb.Worksheets.Add("Budget vs Actual");
                var headers2 = new[] { "Category", "Budget", "Spent", "Remaining", "% Used" };
                for (int i = 0; i < headers2.Length; i++)
                {
                    ws2.Cell(1, i + 1).Value = headers2[i];
                    ws2.Cell(1, i + 1).Style.Font.Bold = true;
                    ws2.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#0058be");
                    ws2.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
                }

                int r = 2;
                foreach (var b in budgets)
                {
                    var spent = expenses.Where(e => e.CategoryName == b.CategoryName).Sum(e => e.Amount);
                    var remaining = b.Amount - spent;
                    var pct = b.Amount > 0 ? (spent / b.Amount) * 100 : 0;

                    ws2.Cell(r, 1).Value = b.CategoryName;
                    ws2.Cell(r, 2).Value = b.Amount;
                    ws2.Cell(r, 2).Style.NumberFormat.Format = "PKR #,##0.00";
                    ws2.Cell(r, 3).Value = spent;
                    ws2.Cell(r, 3).Style.NumberFormat.Format = "PKR #,##0.00";
                    ws2.Cell(r, 4).Value = remaining;
                    ws2.Cell(r, 4).Style.NumberFormat.Format = "PKR #,##0.00";
                    ws2.Cell(r, 5).Value = Math.Round(pct, 1);
                    ws2.Cell(r, 5).Style.NumberFormat.Format = "0.0\"%\"";

                    if (remaining < 0)
                        ws2.Cell(r, 4).Style.Font.FontColor = XLColor.Red;
                    else
                        ws2.Cell(r, 4).Style.Font.FontColor = XLColor.FromHtml("#16a34a");

                    r++;
                }

                ws2.Columns().AdjustToContents();
            }

            using var stream = new MemoryStream();
            wb.SaveAs(stream);
            stream.Position = 0;

            return File(stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"expense-report-{m:00}-{y}.xlsx");
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private async Task<List<(string Title, string CategoryName, decimal Amount, DateTime Date)>> GetExpensesForMonth(int month, int year)
        {
            return await _context.Expenses
                .Where(e => e.UserId == UserId && !e.IsDelete
                            && e.Date.Month == month && e.Date.Year == year)
                .Include(e => e.Category)
                .Select(e => ValueTuple.Create(e.Title, e.Category.CategoryName, e.Amount, e.Date))
                .ToListAsync();
        }

        private async Task<List<(string CategoryName, decimal Amount)>> GetBudgetsForMonth(int month, int year)
        {
            return await _context.CategoryBudgets
                .Where(b => b.UserId == UserId && b.Month == month && b.Year == year)
                .Include(b => b.Category)
                .Select(b => ValueTuple.Create(b.Category.CategoryName, b.Amount))
                .ToListAsync();
        }

        private static void SummaryCard(RowDescriptor row, string label, string value)
        {
            row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2)
                .Padding(8).Column(col =>
                {
                    col.Item().Text(label).FontSize(9).FontColor(Colors.Grey.Medium);
                    col.Item().Text(value).FontSize(14).SemiBold();
                });
        }
        private static void TableHeader(TableDescriptor table, params string[] headers)
        {
            table.Header(header =>
            {
                foreach (var h in headers)
                {
                    header.Cell()
                        .Background(Colors.Blue.Medium)
                        .Padding(4)
                        .Text(h)
                        .FontColor(Colors.White)
                        .SemiBold();
                }
            });
        }
        //private static void TableHeader(TableDescriptor table, params string[] headers)
        //{
        //    foreach (var h in headers)
        //    {
        //        table.Header(header =>
        //        {
        //            header.Cell().Background(Colors.Blue.Medium).Padding(4)
        //                .Text(h).FontColor(Colors.White).SemiBold();
        //        });
        //    }
        //}
    }
}
