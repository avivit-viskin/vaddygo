namespace ParentCommitteeAPI.DTOs
{
    /*
      DashboardResponseDto — סיכום מסך הבית (UI_SPEC ס' 8), מחושב כולו בשרת:
      יעד הגבייה מהגדרת הגן, הנגבה בפועל (יתמלא כשמודל התשלומים ייבנה בשלב 5),
      פירוקים לפי אמצעי תשלום וקטגוריה, התראות וימי הולדת קרובים של הצוות.
    */
    public class DashboardResponseDto
    {
        public string GanName { get; set; } = string.Empty;

        /* שנת הלימודים הלועזית (2026 = נפתחת בספטמבר 2026); הלקוח מציג אותה כתשפ"ז */
        public int Year { get; set; }

        public int ChildrenCount { get; set; }

        public decimal CollectionTarget { get; set; }
        public decimal CollectedTotal { get; set; }
        public decimal OpenDebt { get; set; }
        public decimal BoxBalance { get; set; }

        /* אחוז התקדמות הגבייה (0-100, מעוגל) */
        public int ProgressPercent { get; set; }

        public List<DashboardAmountDto> ByPaymentMethod { get; set; } = new();
        public List<DashboardCategoryDto> ByCategory { get; set; } = new();
        public List<DashboardAlertDto> Alerts { get; set; } = new();
        public List<DashboardBirthdayDto> UpcomingBirthdays { get; set; } = new();
    }

    /* סכום לפי אמצעי תשלום: bit / paybox / cash */
    public class DashboardAmountDto
    {
        public string Method { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public class DashboardCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal TargetAmount { get; set; }
        public decimal CollectedAmount { get; set; }

        /* כמה כסף כבר יצא מהקטגוריה הזו (הוצאות שסווגו לשם הקטגוריה) */
        public decimal SpentAmount { get; set; }
    }

    /* התראה למסך הבית; Type מאפשר ללקוח אייקון/צבע מתאים: payments / birthday */
    public class DashboardAlertDto
    {
        public string Type { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class DashboardBirthdayDto
    {
        public int StaffMemberId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime BirthDate { get; set; }

        /* התאריך הקרוב שבו יחול יום ההולדת (השנה או בשנה הבאה) */
        public DateTime NextBirthday { get; set; }
    }
}
