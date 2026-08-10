namespace ParentCommitteeAPI.Middleware
{
    /*
      SecurityHeadersMiddleware — כותרות אבטחה סטנדרטיות על כל תשובה.

      מה כל אחת מונעת:
      • X-Content-Type-Options: nosniff — מונע מהדפדפן "לנחש" סוג קובץ ולהריץ
        תוכן שהועלה (למשל תמונת מוצר) כאילו היה סקריפט.
      • X-Frame-Options: DENY — מונע הטמעה של המערכת בתוך iframe באתר זר
        (clickjacking: אתר שמכסה את המסך ומטעה ללחוץ על כפתורים אמיתיים).
      • Referrer-Policy — לא מדליף כתובות פנימיות (שכוללות טוקן של ספק!)
        לאתרים חיצוניים שמקושרים מהמערכת.
      • Strict-Transport-Security — הדפדפן יתעקש על HTTPS גם אם מישהו ינסה
        להוריד את החיבור ל-HTTP. רק בייצור: בפיתוח מקומי אין תעודה.

      ה-API מחזיר JSON בלבד ואינו מגיש דפים, ולכן אין כאן CSP — היא שייכת
      לשירות הפרונט. כותרות ולא הגדרה בפלטפורמה: כך ההגנה נוסעת עם הקוד ולא
      תלויה בהגדרה שאפשר לשכוח בפריסה הבאה.
    */
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly bool _isProduction;

        public SecurityHeadersMiddleware(RequestDelegate next, IWebHostEnvironment env)
        {
            _next = next;
            _isProduction = !env.IsDevelopment();
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var headers = context.Response.Headers;
            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Frame-Options"] = "DENY";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            if (_isProduction)
            {
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
            }

            await _next(context);
        }
    }
}
