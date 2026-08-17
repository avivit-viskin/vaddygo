namespace ParentCommitteeAPI.DTOs
{
    /*
      SecurityStatusDto — מצב הגנות המערכת, למסך המנהלת.

      נועד לענות על שאלה אחת שאי אפשר לענות עליה מהממשק: "האם ההגנה שהגדרתי
      באמת פועלת?". הצפנה, למשל, אינה נראית — המערכת עובדת בדיוק אותו דבר עם
      מפתח ובלעדיו, וההבדל היחיד הוא מה כתוב בקובץ המסד.

      מוחזר **רק למנהלת** (SuperAdmin) ומכיל דגלים בלבד — לעולם לא מפתחות,
      סודות או ערכים.
    */
    public class SecurityStatusDto
    {
        /* האם השדות הרגישים נשמרים מוצפנים (Encryption:Key מוגדר) */
        public bool EncryptionAtRest { get; set; }

        /* האם מוגדר מפתח JWT אמיתי (ולא מפתח הפיתוח הציבורי) */
        public bool StrongJwtKey { get; set; }

        /* האם מוגדרת סליקה אמיתית (ולא הסימולטור) */
        public bool RealPaymentProvider { get; set; }

        /* האם הגיבוי האוטומטי דלוק */
        public bool BackupsEnabled { get; set; }

        /* האם ה-CORS מוגבל לדומיין אמיתי (ולא נשאר על localhost) */
        public bool ProductionCors { get; set; }

        /* מתי בוצע הגיבוי האחרון שנמצא בתיקיית הגיבויים; null אם אין */
        public DateTime? LastBackupAt { get; set; }

        /* כמה תלמידים עדיין שמורים כטקסט גלוי (נשמרו לפני הפעלת ההצפנה) */
        public int PendingEncryption { get; set; }
    }
}
