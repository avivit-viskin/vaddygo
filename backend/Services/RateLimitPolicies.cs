using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace ParentCommitteeAPI.Services
{
    /*
      RateLimitPolicies — הגבלת קצב על נקודות הקצה הפתוחות לכולם.

      למה זה נחוץ: הכניסה, ההרשמה ואיפוס הסיסמה פתוחים ללא הזדהות (בהכרח —
      זה מסך הכניסה). בלי תקרה, אפשר לנסות סיסמאות בקצב של אלפי ניסיונות
      בדקה עד שאחת מצליחה. הסיסמה המינימלית במערכת הייתה 6 תווים, ולכן ניחוש
      גס הוא איום מעשי ולא תיאורטי.

      המדיניות:
      • "auth"   — כניסה/הרשמה/כניסת Google: 10 ניסיונות בדקה לכל כתובת IP.
      • "public" — נקודות ציבוריות אחרות (הצבעה בסקר, קטלוג, פורטל הספק):
                   60 בקשות בדקה לכל IP — נדיב למשתמש אמיתי, חוסם הצפה.

      החלוקה לפי IP ולא לפי משתמש בכוונה: בשלב הכניסה עוד אין משתמש מזוהה.
      תוקף עם הרבה כתובות עדיין יעקוף — זו הגנה מפני ניחוש גס, לא מפני מתקפה
      מבוזרת (לזה נדרשת שכבה בפלטפורמה).

      הודעת החסימה חוזרת בעברית עם 429, כדי שהלקוח יציג משהו מובן ולא שגיאה גולמית.
    */
    public static class RateLimitPolicies
    {
        public const string Auth = "auth";
        public const string Public = "public";

        public static void AddVaddyGoRateLimiting(this IServiceCollection services)
        {
            services.AddRateLimiter(options =>
            {
                options.AddPolicy(Auth, httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: ClientKey(httpContext),
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 10,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0,
                        }));

                options.AddPolicy(Public, httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: ClientKey(httpContext),
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 60,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0,
                        }));

                options.OnRejected = async (context, cancellationToken) =>
                {
                    context.HttpContext.Response.StatusCode =
                        StatusCodes.Status429TooManyRequests;
                    await context.HttpContext.Response.WriteAsJsonAsync(new
                    {
                        message = "יותר מדי ניסיונות. כדאי להמתין דקה ולנסות שוב."
                    }, cancellationToken);
                };
            });
        }

        /*
          מפתח החלוקה — כתובת ה-IP של הלקוח. ב-Railway הבקשה עוברת דרך proxy,
          ולכן ה-IP האמיתי מגיע בכותרת X-Forwarded-For (הערך הראשון ברשימה).
          נפילה ל-"unknown" מאחדת את מי שאין לו IP מזוהה למכסה אחת — מחמיר, וזה
          הכיוון הבטוח.
        */
        private static string ClientKey(HttpContext httpContext)
        {
            var forwarded = httpContext.Request.Headers["X-Forwarded-For"].ToString();
            if (!string.IsNullOrWhiteSpace(forwarded))
            {
                return forwarded.Split(',')[0].Trim();
            }
            return httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }
    }
}
