namespace ParentCommitteeAPI.Models
{
    /*
      VendorProduct — מוצר של ספק (שם + מחיר + תמונה). ישות Owned של Vendor:
      אין לו חיים משלו — נשמר ונמחק יחד עם הספק שלו.
    */
    public class VendorProduct
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }

        /* תיאור חופשי קצר של המוצר (אופציונלי) — מוצג לוועד ובקטלוג מתחת לשם. */
        public string Description { get; set; } = string.Empty;

        /* קישור לתמונת המוצר (URL). העלאת קובץ ישירה תיכנס עם תשתית ה-Drive (שלב 8) */
        public string ImageUrl { get; set; } = string.Empty;

        /* מיקום התמונה בתוך הריבוע (CSS object-position, למשל "50% 30%") — כדי
           שהספק ימרכז את התמונה. ריק = מרכז (50% 50%). מוחל בכל מקום שהתמונה מוצגת. */
        public string ImagePosition { get; set; } = string.Empty;

        /* זום/הגדלה של התמונה בריבוע (1 = ברירת מחדל, עד 4). 0 (רשומות ישנות) = 1. */
        public decimal ImageZoom { get; set; } = 1;

        /* התיקייה/חג שאליו שייך המוצר (ראש השנה, סוכות, מתנות לצוות...). ריק = ללא. */
        public string Folder { get; set; } = string.Empty;

        /* יחידת המידה שהמחיר מתייחס אליה (למשל: יח', מארז, ק"ג). ריק = ללא. */
        public string Unit { get; set; } = string.Empty;

        /*
          מתי נוסף המוצר — ל"המוצר האחרון שהוספת" בדוח הספק.
          nullable: מוצרים שנוצרו לפני הוספת השדה אין להם תאריך, והם מוצגים
          כ"לא ידוע" במקום לקבל תאריך מומצא.
        */
        public DateTime? CreatedAt { get; set; }

        public int VendorId { get; set; }
        public Vendor? Vendor { get; set; }
    }
}
