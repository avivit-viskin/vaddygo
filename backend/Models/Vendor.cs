namespace ParentCommitteeAPI.Models
{
    /*
      Vendor — ספק של הוועד (UI_SPEC ס' 12): שם, קישור לקטלוג, ומוצרים.
      אגרגט: המוצרים (Owned) נטענים ונשמרים תמיד יחד עם הספק.
    */
    public class Vendor
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string CatalogUrl { get; set; } = string.Empty;

        public List<VendorProduct> Products { get; set; } = new();
    }
}
