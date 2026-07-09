using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      VendorWriteDto — הבסיס המשותף להוספה ולעריכה של ספק (UI_SPEC ס' 12):
      שם, קישור לקטלוג, וואטסאפ, מוצרים (עם תמונה) וקישורים לרשתות חברתיות.
    */
    public abstract class VendorWriteDto
    {
        [Required(ErrorMessage = "שם הספק הוא שדה חובה")]
        [StringLength(80, ErrorMessage = "שם הספק יכול להכיל עד 80 תווים")]
        public string Name { get; set; } = string.Empty;

        [StringLength(300, ErrorMessage = "הקישור ארוך מדי")]
        public string CatalogUrl { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "פרטי הוואטסאפ ארוכים מדי")]
        public string WhatsApp { get; set; } = string.Empty;

        public List<VendorProductDto> Products { get; set; } = new();
        public List<VendorSocialLinkDto> SocialLinks { get; set; } = new();
    }

    public class VendorProductDto
    {
        [Required(ErrorMessage = "שם המוצר הוא שדה חובה")]
        [StringLength(80, ErrorMessage = "שם המוצר יכול להכיל עד 80 תווים")]
        public string Name { get; set; } = string.Empty;

        [Range(0, 1000000, ErrorMessage = "המחיר חייב להיות בין 0 ל-1,000,000")]
        public decimal Price { get; set; }

        [StringLength(300, ErrorMessage = "קישור התמונה ארוך מדי")]
        public string ImageUrl { get; set; } = string.Empty;
    }

    public class VendorSocialLinkDto
    {
        [StringLength(40, ErrorMessage = "שם הרשת ארוך מדי")]
        public string Label { get; set; } = string.Empty;

        [Required(ErrorMessage = "קישור הרשת החברתית הוא שדה חובה")]
        [StringLength(300, ErrorMessage = "הקישור ארוך מדי")]
        public string Url { get; set; } = string.Empty;
    }

    public class VendorCreateDto : VendorWriteDto
    {
    }

    public class VendorUpdateDto : VendorWriteDto
    {
    }

    public class VendorResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string CatalogUrl { get; set; } = string.Empty;
        public string WhatsApp { get; set; } = string.Empty;
        public List<VendorProductResponseDto> Products { get; set; } = new();
        public List<VendorSocialLinkResponseDto> SocialLinks { get; set; } = new();
    }

    public class VendorProductResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
    }

    public class VendorSocialLinkResponseDto
    {
        public int Id { get; set; }
        public string Label { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }
}
