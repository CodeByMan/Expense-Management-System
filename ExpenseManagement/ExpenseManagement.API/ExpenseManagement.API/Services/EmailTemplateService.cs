namespace ExpenseManagement.API.Services
{
    using System.Collections.Generic;
    using System.IO;
    using System.Threading.Tasks;

    public interface IEmailTemplateService
    {
        Task<string> LoadTemplateAsync(string templateName, Dictionary<string, string> values);
    }

    public class EmailTemplateService : IEmailTemplateService
    {
        public async Task<string> LoadTemplateAsync(string templateName, Dictionary<string, string> values)
        {
            var path = Path.Combine(Directory.GetCurrentDirectory(), "Templates", $"{templateName}.html");

            string content = await File.ReadAllTextAsync(path);

            foreach (var item in values)
            {
                content = content.Replace($"{{{{{item.Key}}}}}", item.Value);
            }

            return content;
        }
    }

}
