namespace ParentCommitteeAPI.Middleware
{
    /*
      ErrorHandlingMiddleware — טיפול שגיאות מרכזי אחד לכל השרת (במקום try/catch בכל קונטרולר).
      השגיאה המלאה נכתבת ללוג; הלקוח מקבל הודעה ידידותית בעברית בלי פרטים טכניים.
    */
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;

        public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (ForbiddenException forbidden)
            {
                // חוסר הרשאה (למשל "צופה" שמנסה לערוך) — 403 עם הודעה ידידותית
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { message = forbidden.Message });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Unhandled exception on {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsJsonAsync(new { message = "משהו השתבש בשרת. נסי שוב בעוד רגע." });
            }
        }
    }
}
