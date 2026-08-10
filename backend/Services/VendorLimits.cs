using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      VendorLimits — תקרות על כמה מקום כרטיס ספק אחד יכול לתפוס.

      למה: תמונות המוצרים נשמרות **בתוך המסד** כ-base64 (data-URI), ולכל תמונה
      בודדת יש תקרה — אבל לא היה שום גבול על הסך הכולל. מסד הנתונים הוא קובץ
      אחד על הדיסק של Railway; ספק אחד עם מאות תמונות כבדות (או מי שנרשם כדי
      להזיק) יכול למלא אותו — וזה מפיל את **כל** המערכת, לא רק את הכרטיס שלו.

      התקרות נדיבות בכוונה: קטלוג אמיתי לא מתקרב אליהן, ולכן ספק לגיטימי לא
      ירגיש אותן. הן קיימות כדי לעצור שימוש חריג.

      ניתנות לשינוי בהגדרות: Vendors:MaxProducts / Vendors:MaxImageBytes.
    */
    public static class VendorLimits
    {
        public const int DefaultMaxProducts = 300;

        /* ~25MB של תמונות לכרטיס. קטלוג של 300 מוצרים עם תמונה מכווצת
           (~80KB לתמונה) מגיע לכ-24MB, ולכן זו תקרה מציאותית ולא מגבילה. */
        public const long DefaultMaxImageBytes = 25L * 1024 * 1024;

        /*
          מחזיר הודעת שגיאה בעברית אם הכרטיס חורג, או null אם תקין.
          ההודעה אומרת מה לעשות — לא רק שנכשל.
        */
        public static string? Validate(
            List<VendorProductDto>? products, int maxProducts, long maxImageBytes)
        {
            var list = products ?? new List<VendorProductDto>();
            if (list.Count > maxProducts)
            {
                return $"אפשר עד {maxProducts} מוצרים בכרטיס. כדאי למחוק מוצרים ישנים.";
            }

            // אורך המחרוזת ≈ מספר הבייטים; base64 הוא ASCII, ולכן זו מדידה טובה
            // מספיק לתקרה, בלי לפענח את התמונות (שהיה יקר בזיכרון).
            long total = 0;
            foreach (var product in list)
            {
                total += (product.ImageUrl ?? string.Empty).Length;
            }
            if (total > maxImageBytes)
            {
                var mb = maxImageBytes / (1024 * 1024);
                return $"סך התמונות בכרטיס חורג מ-{mb}MB. כדאי למחוק תמונות או להעלות אותן קטנות יותר.";
            }

            return null;
        }
    }
}
