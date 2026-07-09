namespace ParentCommitteeAPI.Models
{
    /*
      VendorProduct — מוצר של ספק (שם + מחיר). ישות Owned של Vendor:
      אין לו חיים משלו — נשמר ונמחק יחד עם הספק שלו.
    */
    public class VendorProduct
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }

        public int VendorId { get; set; }
        public Vendor? Vendor { get; set; }
    }
}
