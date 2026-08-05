using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      VendorWriteDto — הבסיס המשותף להוספה ולעריכה של ספק (UI_SPEC ס' 12):
      שם, קישור לקטלוג, וואטסאפ, מוצרים (עם תמונה) וקישורים לרשתות חברתיות.
    */
    public abstract class VendorWriteDto
    {
        [Required(ErrorMessage = "שם הספק הוא שדה חובה")]
        [StringLength(80, ErrorMessage = "שם הספק יכול להכיל עד 80 תווים")]
        public string Name { get; set; } = string.Empty;

        [StringLength(300, ErrorMessage = "הקישור ארוך מדי")]
        public string CatalogUrl { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "פרטי הוואטסאפ ארוכים מדי")]
        public string WhatsApp { get; set; } = string.Empty;

        // מבצע/הצעה מיוחדת — nullable בכוונה (preserve-on-null): שמירה כללית שלא
        // כוללת את השדה לא תמחק מבצע קיים.
        [StringLength(200, ErrorMessage = "המבצע יכול להכיל עד 200 תווים")]
        public string? Offer { get; set; }

        [StringLength(40, ErrorMessage = "הקטגוריה ארוכה מדי")]
        public string Category { get; set; } = string.Empty;

        [StringLength(60, ErrorMessage = "שם העיר/אזור ארוך מדי")]
        public string City { get; set; } = string.Empty;

        [StringLength(300, ErrorMessage = "קישור התשלום ארוך מדי")]
        public string PaymentLink { get; set; } = string.Empty;

        [StringLength(40, ErrorMessage = "מספר הביט ארוך מדי")]
        public string PaymentBit { get; set; } = string.Empty;

        // פייבוקס — מספר טלפון או קישור. nullable בכוונה: כשמטען שמירה כללי (מוצרים/
        // רשתות/שם) לא כולל את השדה, הוא מגיע null והשרת משאיר את הערך הקיים ולא מוחק.
        [StringLength(300, ErrorMessage = "פרטי הפייבוקס ארוכים מדי")]
        public string? PaymentPaybox { get; set; }

        [StringLength(200, ErrorMessage = "פרטי ההעברה ארוכים מדי")]
        public string PaymentBankInfo { get; set; } = string.Empty;

        [Range(0, 24, ErrorMessage = "מספר התשלומים חייב להיות בין 0 ל-24")]
        public int PaymentInstallments { get; set; }

        public List<VendorProductDto> Products { get; set; } = new();
        public List<VendorSocialLinkDto> SocialLinks { get; set; } = new();
    }

    public class VendorProductDto
    {
        [Required(ErrorMessage = "שם המוצר הוא שדה חובה")]
        [StringLength(80, ErrorMessage = "שם המוצר יכול להכיל עד 80 תווים")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "התיאור יכול להכיל עד 500 תווים")]
        public string Description { get; set; } = string.Empty;

        [Range(0, 1000000, ErrorMessage = "המחיר חייב להיות בין 0 ל-1,000,000")]
        public decimal Price { get; set; }

        // מכיל קישור (URL) או תמונה מוטמעת (base64 data-URI) שהספק העלה מהטלפון —
        // ולכן המגבלה גבוהה. התמונה מכווצת בצד הלקוח כדי להישאר קטנה.
        [StringLength(3_000_000, ErrorMessage = "קובץ התמונה גדול מדי")]
        public string ImageUrl { get; set; } = string.Empty;

        [StringLength(40, ErrorMessage = "שם התיקייה ארוך מדי")]
        public string Folder { get; set; } = string.Empty;
    }

    public class VendorSocialLinkDto
    {
        [StringLength(40, ErrorMessage = "שם הרשת ארוך מדי")]
        public string Label { get; set; } = string.Empty;

        [Required(ErrorMessage = "קישור הרשת החברתית הוא שדה חובה")]
        [StringLength(300, ErrorMessage = "הקישור ארוך מדי")]
        public string Url { get; set; } = string.Empty;
    }

    /* פרטי התחברות שהספק מגדיר לעצמו (כדי לחזור בלי הקישור) */
    public class VendorCredentialsDto
    {
        [Required(ErrorMessage = "צריך כתובת מייל")]
        [EmailAddress(ErrorMessage = "כתובת המייל אינה תקינה")]
        [StringLength(120, ErrorMessage = "כתובת המייל ארוכה מדי")]
        public string LoginEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך סיסמה")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "הסיסמה חייבת להכיל 6 תווים לפחות")]
        public string Password { get; set; } = string.Empty;
    }

    /* בקשת התחברות ספק — מאמתת מייל+סיסמה ומחזירה את טוקן העריכה */
    public class VendorLoginDto
    {
        [Required(ErrorMessage = "צריך כתובת מייל")]
        public string LoginEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך סיסמה")]
        public string Password { get; set; } = string.Empty;
    }

    /* בקשת קוד איפוס סיסמה לספק — הקוד נשלח למייל שהספק הגדיר */
    public class VendorForgotPasswordDto
    {
        [Required(ErrorMessage = "צריך כתובת מייל")]
        [EmailAddress(ErrorMessage = "כתובת המייל אינה תקינה")]
        public string Email { get; set; } = string.Empty;
    }

    /* איפוס סיסמה לספק — הקוד מהמייל + סיסמה חדשה */
    public class VendorResetPasswordDto
    {
        [Required(ErrorMessage = "צריך כתובת מייל")]
        public string LoginEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך את הקוד מהמייל")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך סיסמה חדשה")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "הסיסמה חייבת להכיל 6 תווים לפחות")]
        public string NewPassword { get; set; } = string.Empty;
    }

    /* שינוי סיסמה של ספק מחובר דרך הטוקן — סיסמה חדשה בלבד (הטוקן הוא ההרשאה) */
    public class VendorChangePasswordDto
    {
        [Required(ErrorMessage = "צריך סיסמה חדשה")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "הסיסמה חייבת להכיל 6 תווים לפחות")]
        public string NewPassword { get; set; } = string.Empty;
    }

    /* הרשמת ספק חדש בעצמו — שם עסק + מייל + סיסמה. נוצרת רשומת ספק חדשה עם
       טוקן עריכה, והספק ממשיך למלא את הכרטיס והמוצרים שלו. */
    public class VendorRegisterDto
    {
        [Required(ErrorMessage = "צריך שם עסק/ספק")]
        [StringLength(80, ErrorMessage = "שם העסק ארוך מדי")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך כתובת מייל")]
        [EmailAddress(ErrorMessage = "כתובת המייל אינה תקינה")]
        [StringLength(120, ErrorMessage = "כתובת המייל ארוכה מדי")]
        public string LoginEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך סיסמה")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "הסיסמה חייבת להכיל 6 תווים לפחות")]
        public string Password { get; set; } = string.Empty;
    }

    public class VendorCreateDto : VendorWriteDto
    {
    }

    public class VendorUpdateDto : VendorWriteDto
    {
    }

    public class VendorResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string CatalogUrl { get; set; } = string.Empty;
        public string WhatsApp { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string PaymentLink { get; set; } = string.Empty;
        public string PaymentBit { get; set; } = string.Empty;
        public string PaymentPaybox { get; set; } = string.Empty;
        public string PaymentBankInfo { get; set; } = string.Empty;
        public int PaymentInstallments { get; set; }
        public List<VendorProductResponseDto> Products { get; set; } = new();
        public List<VendorSocialLinkResponseDto> SocialLinks { get; set; } = new();
        /* האם הספק כבר הגדיר מייל+סיסמה לכניסה — כדי להציג את כרטיס "הגדרת כניסה"
           רק בקישור הראשון (לפני שהוגדרו), ולהסתירו אחרי שהספק כבר הגדיר/התחבר. */
        public bool HasLogin { get; set; }

        /* האם הספק ביקש למחוק את החשבון (ממתין לאישור VaddyGo) — לתצוגת המנהלת */
        public bool DeletionRequested { get; set; }

        /* מספר צפיות בקטלוג הציבורי — לדאשבורד הספק */
        public int Views { get; set; }

        /* מספר פניות (לחיצות "בקשת הצעת מחיר") — לדאשבורד הספק */
        public int Leads { get; set; }

        /* מבצע/הצעה מיוחדת שהספק מפרסם — מוצג לוועדים בכרטיס הספק ובקטלוג */
        public string Offer { get; set; } = string.Empty;

        /* "ספק מומלץ" — תג "מומלץ" ומיקום עליון (בשליטת מנהלת VaddyGo) */
        public bool Featured { get; set; }
    }

    public class VendorProductResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string Folder { get; set; } = string.Empty;
    }

    public class VendorSocialLinkResponseDto
    {
        public int Id { get; set; }
        public string Label { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }

    /* פריט קליל למדריך הספקים הציבורי (מרקטפלייס) — בלי מוצרים/תשלום, לרשימה מהירה */
    public class VendorDirectoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public int ProductCount { get; set; }
        public string WhatsApp { get; set; } = string.Empty;
        public bool Featured { get; set; }
    }

    /* גוף הבקשה לסימון/ביטול "ספק מומלץ" */
    public class SetFeaturedDto
    {
        public bool Featured { get; set; }
    }
}
