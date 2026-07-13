namespace ParentCommitteeAPI.Models
{
    public class Event
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;

        // תזכורת לאירוע (UI_SPEC ס' 6 / לוח שנה) — האם לשלוח תזכורת לפני האירוע
        public bool Reminder { get; set; }

        // שיתוף הורה ("אמא/אבא של שבת"): כשמסומן, אפשר לשלוח להורה וואטסאפ
        // עם מה להביא. הטלפון נשמר כדי לפתוח את השיחה ישירות.
        public bool ShareWithParent { get; set; }
        public string WhatToBring { get; set; } = string.Empty;
        public string ParentPhone { get; set; } = string.Empty;

        // המוסד שאליו שייך האירוע (ריבוי מוסדות) — null = ישן ללא שיוך
        public int? GroupId { get; set; }
    }
}
