namespace ParentCommitteeAPI.Models
{
    /*
      User — מנוי המערכת (חבר/ת ועד או מנהלת). ההזדהות לפי UI_SPEC ס' 2:
      בעת הרכישה בוחרים שם משתמש + סיסמה; אפשר להתחבר גם עם Google (אותו חשבון).
      תוקף המנוי גורף עד 30.8 של השנה שאחרי הרכישה (ראו SubscriptionPolicy).
    */
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        // גיבוב הסיסמה (PBKDF2) — לעולם לא הסיסמה עצמה. ריק אם המשתמש נרשם רק דרך Google.
        public string PasswordHash { get; set; } = string.Empty;

        // מזהה חשבון Google (sub) — למשתמש שהתחבר/נרשם עם Google. אופציונלי.
        public string? GoogleId { get; set; }

        // תפקיד: "Member" (חבר/ת ועד) או "SuperAdmin" (מנהלת VaadyGo — ניהול ספקים)
        public string Role { get; set; } = "Member";

        // המנוי תקף עד תאריך זה (כולל). אחריו הכניסה נחסמת.
        public DateTime SubscriptionValidUntil { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
