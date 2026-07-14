using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      StudentWriteDto — הבסיס המשותף ל-Create ול-Update:
      אותם שדות ואותה ולידציה פעם אחת, בלי כפילות (DRY).
    */
    public abstract class StudentWriteDto
    {
        // שם פרטי חובה; שאר השדות אופציונליים כדי לאפשר ייבוא מקובץ (שמות בלבד)
        // והשלמה אחר כך בעריכת התלמיד. הטופס בלקוח עדיין מחייב את השדות בהוספה ידנית.
        [Required(ErrorMessage = "שם פרטי הוא שדה חובה")]
        [StringLength(50, ErrorMessage = "שם פרטי יכול להכיל עד 50 תווים")]
        public string FirstName { get; set; } = string.Empty;

        [StringLength(50, ErrorMessage = "שם משפחה יכול להכיל עד 50 תווים")]
        public string LastName { get; set; } = string.Empty;

        /* שם ההורה (אופציונלי) — נאסף בייבוא ובטופס */
        [StringLength(80, ErrorMessage = "שם ההורה יכול להכיל עד 80 תווים")]
        public string ParentName { get; set; } = string.Empty;

        [StringLength(30, ErrorMessage = "שם הכיתה יכול להכיל עד 30 תווים")]
        public string ClassName { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "מספר הטלפון ארוך מדי")]
        public string ParentPhoneNumber { get; set; } = string.Empty;

        /* תאריך לידה (אופציונלי) — יום/חודש/שנה, להצגת יום ההולדת ברשימה */
        public DateOnly? BirthDate { get; set; }

        /* ── שדות נוספים מקובץ משרד החינוך (כולם אופציונליים) ──────────── */
        [StringLength(20, ErrorMessage = "תעודת הזהות ארוכה מדי")]
        public string IdNumber { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "שדה המין ארוך מדי")]
        public string Gender { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "שדה האלרגיות ארוך מדי")]
        public string Allergies { get; set; } = string.Empty;

        [StringLength(150, ErrorMessage = "הכתובת ארוכה מדי")]
        public string Address { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "כתובת המייל ארוכה מדי")]
        public string ParentEmail { get; set; } = string.Empty;

        [StringLength(80, ErrorMessage = "שם הורה ב' ארוך מדי")]
        public string ParentBName { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "מספר הטלפון ארוך מדי")]
        public string ParentBPhone { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "כתובת המייל ארוכה מדי")]
        public string ParentBEmail { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "שדה סטטוס הנישואין ארוך מדי")]
        public string ParentsMarried { get; set; } = string.Empty;
    }
}
