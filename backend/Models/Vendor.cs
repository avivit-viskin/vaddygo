namespace ParentCommitteeAPI.Models
{
    /*
      Vendor — ספק של הוועד (UI_SPEC ס' 12). ספקים מנוהלים ידנית על ידי מנהלת
      VaddyGo כערוץ הכנסה (ספקים בתשלום). לכל ספק: מוצרים (עם תמונות), קישור
      וואטסאפ, וקישורים לרשתות חברתיות. אגרגט — המוצרים והקישורים (Owned)
      נטענים ונשמרים תמיד יחד עם הספק.
    */
    public class Vendor
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string CatalogUrl { get; set; } = string.Empty;

        /* מספר טלפון או קישור וואטסאפ של הספק — בלקוח נבנה ממנו כפתור wa.me */
        public string WhatsApp { get; set; } = string.Empty;

        public List<VendorProduct> Products { get; set; } = new();
        public List<VendorSocialLink> SocialLinks { get; set; } = new();
    }
}
