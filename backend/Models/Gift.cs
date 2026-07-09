namespace ParentCommitteeAPI.Models
{
    /*
      Gift — מתנה שהוועד מתכנן (UI_SPEC ס' 12): שם, אירוע (חג), תקציב, סטטוס
      וקישור אופציונלי לספק. האירוע נשמר כמזהה חג (שם|שנה עברית) — אותו מזהה
      שבו משתמשים תקציבי החגים בלוח השנה, כדי שהעוזרת התקציבית תדע לקשר ביניהם.
    */
    public class Gift
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        /* מזהה מופע החג ("חנוכה|5787") — אופציונלי; null = מתנה בלי אירוע מסוים */
        public string? HolidayKey { get; set; }
        public string? HolidayName { get; set; }

        public decimal TotalAmount { get; set; }

        /* planned / buying / done — מתוכנן / בקנייה / בוצע */
        public string Status { get; set; } = "planned";

        // קישור אופציונלי לספק
        public int? VendorId { get; set; }
        public Vendor? Vendor { get; set; }
    }
}
