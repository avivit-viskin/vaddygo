namespace ParentCommitteeAPI.DTOs
{
    /*
      SupplierReportDto — הדוח המפורט של הספק על עצמו.

      נבנה לפי בקשת בעלת המוצר (20.08.2026): טווח תאריכים לבחירה כדי שאפשר
      יהיה להשוות תקופה לתקופה, המיקום ברשימת הספקים באזור שלו, ומתי הוא
      עדכן לאחרונה את הכרטיס ואת המוצרים.

      עיקרון שחוזר בכל המסמך הזה: **לא להציג מספר שלא ניתן לבסס.** לכל נתון
      שאין לו היסטוריה מלאה יש שדה נלווה שאומר זאת, במקום להציג 0 שנראה כמו
      עובדה.
    */
    public class SupplierReportDto
    {
        /* הטווח שנבחר בפועל (אחרי נרמול) — כדי שהמסך יציג את מה שבאמת חושב. */
        public DateTime From { get; set; }
        public DateTime To { get; set; }

        public SupplierViewsDto Views { get; set; } = new();
        public SupplierLeadsDto Leads { get; set; } = new();
        public SupplierProductsDto Products { get; set; } = new();
        public SupplierPlacementDto Placement { get; set; } = new();

        /* מתי הספק ערך לאחרונה את הכרטיס. null = מעולם לא נערך מאז ההוספה. */
        public DateTime? LastEditedAt { get; set; }
    }

    public class SupplierViewsDto
    {
        /* סך הצפיות מאז ומעולם — המונה הישן, שקיים גם לפני הספירה היומית. */
        public int Total { get; set; }

        /* צפיות בטווח שנבחר. */
        public int InRange { get; set; }

        /*
          מתי החלה הספירה היומית. אם הטווח שנבחר מתחיל לפני התאריך הזה, המספר
          InRange חלקי — והמסך אומר זאת במפורש. null = עדיין אין אף יום שנספר.
        */
        public DateTime? TrackedSince { get; set; }

        /* האם הטווח שנבחר קודם לתחילת הספירה (ואז InRange אינו מלא). */
        public bool RangeStartsBeforeTracking { get; set; }
    }

    public class SupplierLeadsDto
    {
        public int Total { get; set; }
        public int InRange { get; set; }

        /* פילוח לפי סטטוס בתוך הטווח: new / quoted / won / closed / irrelevant */
        public Dictionary<string, int> ByStatus { get; set; } = new();
    }

    public class SupplierProductsDto
    {
        public int Total { get; set; }

        /* מתי נוסף המוצר האחרון. null = לכל המוצרים אין תאריך (נוצרו לפני השדה). */
        public DateTime? LastAddedAt { get; set; }

        /* כמה מוצרים נוספו בטווח שנבחר (רק כאלה שיש להם תאריך). */
        public int AddedInRange { get; set; }

        /* כמה מוצרים אין להם תאריך יצירה — כדי שהמסך לא יתיימר לדעת. */
        public int WithoutDate { get; set; }
    }

    /*
      SupplierPlacementDto — המיקום ברשימת הספקים שוועד רואה **באזור של הספק**.
      זה בדיוק הסדר שבו הרשימה מוצגת בפועל: מקודמים תחילה, ואז לפי א׳-ב׳.
    */
    public class SupplierPlacementDto
    {
        /* האזור שלפיו חושב המיקום (עיר הספק). ריק = לא הוגדרה עיר. */
        public string Area { get; set; } = string.Empty;

        /* המקום ברשימה (1 = ראשון). 0 = לא ניתן לחשב (אין עיר). */
        public int Rank { get; set; }

        /* מתוך כמה ספקים באותו אזור. */
        public int OutOf { get; set; }

        /* האם הכרטיס מקודם — מה שמסביר קפיצה למעלה ברשימה. */
        public bool Featured { get; set; }

        /* המיקום בקטגוריה של הספק (בתוך אותו אזור), אם הוגדרה קטגוריה. */
        public string Category { get; set; } = string.Empty;
        public int RankInCategory { get; set; }
        public int OutOfInCategory { get; set; }
    }
}
