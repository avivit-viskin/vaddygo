namespace ParentCommitteeAPI.Services
{
    /* תוצאת מחיקת גן ע"י המנהלת (ניקוי גני-בדיקה מהמסך הניהולי). */
    public enum CommitteeDeleteResult
    {
        Deleted,        // נמחק בהצלחה
        NotFound,       // הגן לא נמצא
        ProtectedAdmin, // הגן שייך לחשבון מנהלת — לא נמחק (הגנה מפני נעילה-עצמית)
        HasMultiple,    // לחשבון יש כמה גנים — לא מוחקים מכאן (סיכון למחיקת גן אמיתי)
        ProtectedAccount, // חשבון מוגן (בוט הבדיקות) — מוחרג מכל מחיקה אוטומטית
    }

    /* תוצאת מחיקת "נרשם שלא השלים" (משתמש ללא אף גן) ע"י המנהלת. */
    public enum IncompleteUserDeleteResult
    {
        Deleted,        // נמחק בהצלחה
        NotFound,       // המשתמש לא נמצא
        ProtectedAdmin, // חשבון מנהלת — לא נמחק
        HasGroup,       // למשתמש יש ועד — אינו "נרשם שלא השלים" (מוחקים דרך מחיקת גן)
        ProtectedAccount, // חשבון מוגן (בוט הבדיקות) — מוחרג מכל מחיקה אוטומטית
    }

    public interface IAccountService
    {
        /*
          מוחק לצמיתות את המשתמש ואת כל הנתונים התלויים בו ("הזכות להימחק",
          חוק הגנת הפרטיות). מחזיר true אם המשתמש היה קיים ונמחק.
        */
        Task<bool> DeleteAccountAsync(int userId);

        /*
          מחיקת גן (ועד) ע"י המנהלת — לניקוי גני-בדיקה שנוצרו בפיתוח. בטוח:
          מוחק רק גן יחיד של חשבון *רגיל* (חשבון-בדיקה טיפוסי), ואז מוחק את
          החשבון כולו דרך DeleteAccountAsync. מסרב לחשבון מנהלת או לחשבון עם
          כמה גנים — כדי לא לנעול את המנהלת ולא למחוק גן אמיתי בטעות.
        */
        Task<CommitteeDeleteResult> DeleteCommitteeAsync(int groupId);

        /*
          מחיקת "נרשם שלא השלים" — משתמש שנרשם אך אין לו אף ועד (נעצר באמצע),
          לניקוי חשבונות-בדיקה. בטוח: מסרב לחשבון מנהלת ולמשתמש שיש לו ועד (את
          אלה מוחקים דרך מחיקת הגן), כדי לא למחוק לקוח אמיתי בטעות.
        */
        Task<IncompleteUserDeleteResult> DeleteIncompleteUserAsync(int userId);
    }
}
