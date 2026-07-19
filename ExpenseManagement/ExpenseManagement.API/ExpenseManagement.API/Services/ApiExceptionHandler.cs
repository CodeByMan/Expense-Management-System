using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace ExpenseManagement.API.Services
{
    public sealed class ApiExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<ApiExceptionHandler> _logger;

        public ApiExceptionHandler(ILogger<ApiExceptionHandler> logger)
        {
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            var statusCode = exception is ValidationException
                ? StatusCodes.Status400BadRequest
                : StatusCodes.Status500InternalServerError;

            if (statusCode == StatusCodes.Status500InternalServerError)
                _logger.LogError(exception, "Unhandled API exception for {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
            else
                _logger.LogWarning("Rejected invalid request for {Method} {Path}: {Message}", httpContext.Request.Method, httpContext.Request.Path, exception.Message);

            var problem = new ProblemDetails
            {
                Status = statusCode,
                Title = statusCode == StatusCodes.Status400BadRequest ? "Invalid request" : "An unexpected error occurred",
                Detail = statusCode == StatusCodes.Status400BadRequest
                    ? exception.Message
                    : "The request could not be completed. Please try again later."
            };

            httpContext.Response.StatusCode = statusCode;
            await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
            return true;
        }
    }
}
