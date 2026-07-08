namespace ParentCommitteeAPI.Models
{
    public class Event
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
    }
}
