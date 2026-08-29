namespace ParentCommitteeAPI.Services
{
    /*
      ProtectedAccounts — חשבונות שמחיקה אוטומטית לא נוגעת בהם.

      הרקע: חשבון בוט-הבדיקות (QA) נמחק בטעות ע"י סריקת ניקוי של דומיינים
      שמורים, ומאז בדיקות ה-E2E נכשלו שבעה ימים ברצף. זו התקלה הגרועה מסוגה —
      מה שאמור להתריע כשהמערכת נשברת כבה בשקט, ואף אחד לא יודע.

      ההגנה בנויה משתי שכבות, בכוונה:

      1. **דגל במסד (Users.IsProtected)** — עובד גם כשאין שום הגדרה בענן, וגם
         אם החשבון ישנה כתובת מייל בעתיד.

      2. **רשימת מיילים בהגדרות (Admin:ProtectedEmails)** — רשת ביטחון למקרה
         שהחשבון ייווצר מחדש (אז הדגל במסד עדיין כבוי). אפשר להוסיף כתובות
         בלי פריסה חדשה, מופרדות בפסיק.

      שכבה אחת לא הספיקה: הדגל לבדו נעלם עם מחיקה, וההגדרה לבדה נשענת על כך
      שמישהו יזכור להגדיר אותה בענן. יחד — צריך ששתיהן ייכשלו כדי לאבד את הבוט.
    */
    public static class ProtectedAccounts
    {
        /* ברירת מחדל מובנית — כדי שההגנה תעבוד גם בלי אף הגדרה בענן. */
        public const string DefaultProtectedEmails = "avivitm91+qabot@gmail.com";

        /* הכתובות המוגנות, מנורמלות (אותיות קטנות, בלי רווחים). */
        public static HashSet<string> Emails(IConfiguration config)
        {
            var raw = config["Admin:ProtectedEmails"];
            var list = string.IsNullOrWhiteSpace(raw) ? DefaultProtectedEmails : raw;
            return list
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(e => e.ToLowerInvariant())
                .ToHashSet();
        }

        /* האם הכתובת הזו מוגנת מפני מחיקה אוטומטית. */
        public static bool IsProtectedEmail(string? email, IConfiguration config) =>
            !string.IsNullOrWhiteSpace(email)
            && Emails(config).Contains(email.Trim().ToLowerInvariant());

        /*
          האם המשתמש מוגן — דגל במסד **או** כתובת ברשימה. ה-"או" הוא העיקר:
          די בשכבה אחת ששרדה כדי שהחשבון יינצל.
        */
        public static bool IsProtectedUser(Models.User? user, IConfiguration config) =>
            user != null && (user.IsProtected || IsProtectedEmail(user.Email, config));
    }
}
