namespace ParentCommitteeAPI.Models
{
    public class Event
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public DateTime EventDate { get; set; }
        public string Description { get; set; }
        public string Location { get; set; }
    }
}