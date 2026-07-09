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
    }
}
