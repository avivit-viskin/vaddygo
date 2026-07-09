namespace ParentCommitteeAPI.Models
{
    /*
      VendorSocialLink — קישור לרשת חברתית של ספק (אינסטגרם/פייסבוק/אתר...).
      ישות Owned של Vendor: label = שם הרשת להצגה, url = הקישור עצמו.
    */
    public class VendorSocialLink
    {
        public int Id { get; set; }
        public string Label { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;

        public int VendorId { get; set; }
        public Vendor? Vendor { get; set; }
    }
}
