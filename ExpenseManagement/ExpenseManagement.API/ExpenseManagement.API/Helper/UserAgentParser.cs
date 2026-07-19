// Helpers/UserAgentParser.cs
namespace ExpenseManagement.API.Helpers
{
    public static class UserAgentParser
    {
        public static (string Browser, string OS) Parse(string? userAgent)
        {
            if (string.IsNullOrEmpty(userAgent))
                return ("Unknown", "Unknown");

            var ua = userAgent.ToLower();

            var browser = ua switch
            {
                var s when s.Contains("edg/") => "Edge",
                var s when s.Contains("chrome") => "Chrome",
                var s when s.Contains("firefox") => "Firefox",
                var s when s.Contains("safari") && !s.Contains("chrome") => "Safari",
                var s when s.Contains("opera") => "Opera",
                _ => "Unknown"
            };

            var os = ua switch
            {
                var s when s.Contains("windows nt 10") => "Windows 10",
                var s when s.Contains("windows nt 11") => "Windows 11",
                var s when s.Contains("windows") => "Windows",
                var s when s.Contains("macintosh") => "macOS",
                var s when s.Contains("iphone") => "iOS",
                var s when s.Contains("ipad") => "iPadOS",
                var s when s.Contains("android") => "Android",
                var s when s.Contains("linux") => "Linux",
                _ => "Unknown"
            };

            return (browser, os);
        }

        public static string GetDeviceType(string? userAgent)
        {
            if (string.IsNullOrEmpty(userAgent)) return "Unknown";
            var ua = userAgent.ToLower();
            if (ua.Contains("mobile") || ua.Contains("iphone") || ua.Contains("android"))
                return "Mobile";
            if (ua.Contains("ipad") || ua.Contains("tablet"))
                return "Tablet";
            return "Desktop";
        }
    }
}