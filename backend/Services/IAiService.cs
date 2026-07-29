using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IAiService — חוזה עוזרת ה-AI (BL). ה-Controller מדבר רק איתו.
      IsConfigured מאפשר להחזיר הודעה ידידותית כשמפתח ה-API עוד לא הוגדר.
    */
    public interface IAiService
    {
        bool IsConfigured { get; }
        Task<string> AskAsync(string question, string? context);

        // מחלץ מוצרים מטקסט קטלוג (PDF) — מחזיר רשימה מובנית של {שם, פירוט, מחיר}.
        Task<List<ExtractedProductDto>> ExtractProductsAsync(string catalogText);

        // מחלץ מוצרים מתמונת קטלוג (צילום) בעזרת ראייה ממוחשבת (Gemini vision).
        Task<List<ExtractedProductDto>> ExtractProductsFromImageAsync(
            string base64Data, string mimeType);
    }
}
