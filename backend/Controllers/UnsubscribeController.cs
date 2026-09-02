using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      UnsubscribeController — קישור "הסרה מרשימת התפוצה" שבתחתית כל מייל ברודקאסט.
      נפתח מהמייל (GET מדפדפן), מאמת טוקן חתום, מוסיף את הכתובת לרשימת המוסרים,
      ומחזיר דף אישור פשוט (HTML) בעברית. פתוח (בלי התחברות) — הגישה מוגנת בחתימה.
    */
    [ApiController]
    [AllowAnonymous]
    public class UnsubscribeController : ControllerBase
    {
        private readonly IUnsubscribeService _unsubscribe;

        public UnsubscribeController(IUnsubscribeService unsubscribe)
        {
            _unsubscribe = unsubscribe;
        }

        [HttpGet("api/public/unsubscribe")]
        public async Task<IActionResult> Unsubscribe([FromQuery] string? token)
        {
            var email = string.IsNullOrWhiteSpace(token)
                ? null
                : await _unsubscribe.UnsubscribeAsync(token);

            var ok = email != null;
            var message = ok
                ? "הוסרת בהצלחה מרשימת התפוצה של VaddyGo. לא יישלחו אליך עוד עדכונים."
                : "הקישור אינו תקין או שכבר אינו בתוקף. אם ביקשת להסיר את עצמך ולא הצליח — אפשר לפנות אלינו hello@vaddygo.com.";
            var title = ok ? "הוסרת מרשימת התפוצה" : "לא הצלחנו להסיר";
            var icon = ok ? "✓" : "!";

            var html =
$@"<!doctype html>
<html lang=""he"" dir=""rtl"">
<head>
<meta charset=""utf-8"">
<meta name=""viewport"" content=""width=device-width, initial-scale=1"">
<title>{title} — VaddyGo</title>
</head>
<body style=""margin:0;background:#f7f1e6;font-family:Arial,Helvetica,sans-serif;color:#3a2f33"">
  <div style=""max-width:460px;margin:14vh auto;padding:32px 26px;background:#fff;border-radius:18px;box-shadow:0 6px 24px rgba(0,0,0,.08);text-align:center"">
    <div style=""width:60px;height:60px;margin:0 auto 16px;border-radius:50%;background:{(ok ? "#eafaf0" : "#fdecea")};color:{(ok ? "#2e9e5b" : "#c0392b")};font-size:32px;line-height:60px;font-weight:700"">{icon}</div>
    <h1 style=""margin:0 0 10px;font-size:22px"">{title}</h1>
    <p style=""margin:0;font-size:16px;line-height:1.6;color:#6b5348"">{message}</p>
    <p style=""margin:22px 0 0;font-size:14px;color:#9a8f86"">VaddyGo — ניהול ועדי הורים 💗</p>
  </div>
</body>
</html>";

            return Content(html, "text/html; charset=utf-8");
        }
    }
}
