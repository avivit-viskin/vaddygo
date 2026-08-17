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
            catch (ProRequiredException proRequired)
            {
                // צריך מסלול פרו — 402 (Payment Required) ולא 403, כדי שהלקוח
                // יוכל להציע שדרוג במקום להציג "אין לך הרשאה".
                context.Response.StatusCode = StatusCodes.Status402PaymentRequired;
                await context.Response.WriteAsJsonAsync(new { message = proRequired.Message });
            }
            catch (PayloadTooLargeException tooLarge)
            {
                // חריגה מתקרת תוכן (למשל סך התמונות בכרטיס) — 413 עם הסבר מה למחוק
                context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
                await context.Response.WriteAsJsonAsync(new { message = tooLarge.Message });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Unhandled exception on {Method} {Path}",
                    context.Request.Method, RedactTokens(context.Request.Path));

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsJsonAsync(new { message = "משהו השתבש בשרת. נסי שוב בעוד רגע." });
            }
        }

        /*
          מצנזר אסימוני גישה מתוך כתובת הבקשה לפני כתיבתה ללוג.

          למה: חלק מהכתובות הציבוריות **מכילות את המפתח עצמו** — קישור עריכה
          של ספק, קישור הזמנה לגן, קישור סקר. מי שקורא כתובת כזאת מהלוג יכול
          להשתמש בה. לוגים אצל ספק האירוח נשמרים 7 ימים **ואינם ניתנים למחיקה
          לפי בקשה**, ולכן זהו המקום הפחות מתאים לשמור בו מפתח כניסה.

          אותו ליקוי בדיוק נמצא ונסגר קודם בכלי ניטור השגיאות בצד הלקוח.
        */
        /*
          כל האסימונים במערכת נוצרים כ-`Guid.NewGuid().ToString("N")` — בדיוק 32
          תווים הקסדצימליים (קישור ספק, הזמנה לגן, סקר). זיהוי לפי הצורה המדויקת
          ולא לפי אורך או מיקום: כך לא מצונזרים מקטעים תמימים כמו
          "extract-products", והלוג נשאר שימושי לאבחון.
        */
        private static readonly System.Text.RegularExpressions.Regex TokenPattern =
            new("^[0-9a-fA-F]{32}$", System.Text.RegularExpressions.RegexOptions.Compiled);

        internal static string RedactTokens(string path)
        {
            var parts = path.Split('/');
            for (var i = 0; i < parts.Length; i++)
            {
                if (TokenPattern.IsMatch(parts[i]))
                {
                    parts[i] = "<redacted>";
                }
            }
            return string.Join('/', parts);
        }
    }
}
