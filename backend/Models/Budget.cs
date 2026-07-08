namespace ParentCommitteeAPI.Models
{
    public class Budget
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime TransactionDate { get; set; }
        public string Category { get; set; } = string.Empty;
        public bool IsIncome { get; set; }
    }
}
