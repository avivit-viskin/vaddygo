namespace ParentCommitteeAPI.Models
{
    public class Budget
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public DateTime TransactionDate { get; set; }
        public string Category { get; set; }
        public bool IsIncome { get; set; }
    }
}