namespace ParentCommitteeAPI.DTOs
{
    /*
      DTOs לחילוץ מוצרים מטקסט (קטלוג PDF) בעזרת ה-AI. הספק מעלה PDF, הפרונט
      מחלץ ממנו טקסט (pdfjs) ושולח אותו לכאן; ה-AI מחזיר רשימת מוצרים מובנית.
      אין כאן מידע מזהה של ילדים/הורים — רק טקסט הקטלוג של הספק.
    */
    public class AiExtractRequestDto
    {
        public string Text { get; set; } = string.Empty;
    }

    public class ExtractedProductDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }

    public class AiExtractResponseDto
    {
        public List<ExtractedProductDto> Products { get; set; } = new();
    }
}
