namespace ParentCommitteeAPI.Models
{
    /*
      Expense — הוצאה מהקופה (כסף שיצא מהוועד): סכום, אמצעי התשלום שממנו יצא
      (ביט/פייבוקס/מזומן), תיאור אופציונלי ותאריך. משמש לחישוב "יתרת הקופה"
      במסך הבית: יתרה = סך הנגבה − סך ההוצאות (וגם לכל קוביית אמצעי בנפרד).
    */
    public class Expense
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }

        // אמצעי שממנו יצא הכסף: "bit" | "paybox" | "cash"
        public string Method { get; set; } = "cash";

        public string Description { get; set; } = string.Empty;
        public DateTime Date { get; set; }

        // המוסד שאליו שייכת ההוצאה (ריבוי מוסדות) — null = ישן ללא שיוך
        public int? GroupId { get; set; }
    }
}
