namespace ParentCommitteeAPI.Models
{
    /*
      DriveFolder — קישור ידני לתיקיית Google Drive (UI_SPEC ס' 13):
      שם לתצוגה + קישור השיתוף של התיקייה. המשתמשת מדביקה את הקישור,
      והמערכת שומרת אותו ומציגה כפתור שפותח את התיקייה. בלי OAuth.
    */
    public class DriveFolder
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;

        // המוסד שאליו שייכת התיקייה (ריבוי מוסדות) — null = ישן ללא שיוך
        public int? GroupId { get; set; }
    }
}
