using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      UnsubscribeService — קישור "הסרה מרשימת התפוצה" בכל מייל ברודקאסט.

      הטוקן חתום (HMAC) כדי שאי אפשר יהיה להסיר כתובת של מישהו אחר סתם מניחוש —
      רק מי שקיבל את המייל (ובו הקישור החתום) יכול להסיר את עצמו. חסר-מצב (בלי
      טבלת טוקנים): המייל עצמו מקודד בטוקן יחד עם החתימה.
    */
    public interface IUnsubscribeService
    {
        /* טוקן חתום לכתובת — נכנס לקישור ההסרה שבתחתית המייל. */
        string CreateToken(string email);

        /* מאמת טוקן ומוסיף את הכתובת לרשימת המוסרים. מחזיר את הכתובת שהוסרה, או null. */
        Task<string?> UnsubscribeAsync(string token);
    }

    public class UnsubscribeService : IUnsubscribeService
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;

        public UnsubscribeService(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        // מפתח החתימה — משתמש במפתח ה-JWT (סוד שרת יציב בייצור). קידומת נושא
        // ("unsub:") מפרידה בין השימושים כדי שטוקן הסרה לא יתחלף בטוקן אחר.
        private byte[] Key()
        {
            var key = _config["Jwt:Key"];
            if (string.IsNullOrWhiteSpace(key))
            {
                key = "vaddygo-dev-unsubscribe-key"; // פיתוח בלבד; בייצור Jwt:Key חובה
            }
            return Encoding.UTF8.GetBytes(key);
        }

        private string Sign(string email)
        {
            using var hmac = new HMACSHA256(Key());
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes("unsub:" + email));
            return Base64Url(hash)[..22]; // חתימה מקוצרת — מספיק כדי למנוע ניחוש
        }

        public string CreateToken(string email)
        {
            var e = (email ?? string.Empty).Trim();
            return Base64Url(Encoding.UTF8.GetBytes(e)) + "." + Sign(e);
        }

        public async Task<string?> UnsubscribeAsync(string token)
        {
            var parts = (token ?? string.Empty).Split('.');
            if (parts.Length != 2)
            {
                return null;
            }

            string email;
            try
            {
                email = Encoding.UTF8.GetString(Base64UrlDecode(parts[0]));
            }
            catch
            {
                return null;
            }

            // אימות חתימה בזמן קבוע (מונע דליפת מידע דרך זמן ההשוואה).
            var expected = Sign(email);
            if (!CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(parts[1])))
            {
                return null;
            }

            var already = await _db.EmailOptOuts.AnyAsync(o => o.Email == email);
            if (!already)
            {
                _db.EmailOptOuts.Add(new EmailOptOut
                {
                    Email = email,
                    CreatedAt = DateTime.UtcNow,
                });
                await _db.SaveChangesAsync();
            }
            return email;
        }

        // Base64URL בלי ריפוד — בטוח לשימוש בכתובת URL.
        private static string Base64Url(byte[] data) =>
            Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');

        private static byte[] Base64UrlDecode(string s)
        {
            var t = s.Replace('-', '+').Replace('_', '/');
            switch (t.Length % 4)
            {
                case 2: t += "=="; break;
                case 3: t += "="; break;
            }
            return Convert.FromBase64String(t);
        }
    }
}
