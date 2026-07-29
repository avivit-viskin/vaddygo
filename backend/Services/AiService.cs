using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.Json;
using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      AiService — עוזרת ה-AI של VaddyGo. קוראת ל-Google Gemini
      (Generative Language API, method generateContent) דרך HttpClient.
      נבחר המסלול החינמי של Gemini (החלטת בעלת המוצר, 09.07.2026) — דגם flash.
      מפתח ה-API מגיע ממשתני סביבה בלבד (Gemini:ApiKey) — לעולם לא בקוד.
      פרטיות: לא נשלחים לבינה שמות/טלפונים של ילדים או הורים — רק שאלה ורקע כללי.
    */
    public class AiService : IAiService
    {
        // ה-persona והכללים של העוזרת. עברית, טון חם, בלי להמציא נתונים ובלי מידע מזהה.
        private const string SystemPrompt =
            "את העוזרת החכמה של VaddyGo — מערכת לניהול ועד הורים בגנים ובבתי ספר. " +
            "התפקיד שלך לעזור לחברות הוועד: לנסח הודעות להורים (תזכורות תשלום, הזמנות " +
            "לאירועים, עדכונים), לתת רעיונות (למשל למתנות ולחגים) ולעזור להבין את מצב הוועד. " +
            "כתבי בעברית בניסוח אנושי, חם וידידותי — כאילו כתבה חברה טובה בוועד, לא מכונה. " +
            "חשוב: קצר וקולע! הודעות של 2–4 שורות בלבד, בלי פתיחות ארוכות, מליצות או הסברים מיותרים. " +
            "טון נעים ולא תוקפני, עם נגיעה קלה של אמוג'י פה ושם (למשל 🙂💜) — בלי להציף. " +
            "הרחיבי לתשובה ארוכה רק אם המשתמשת ביקשה זאת במפורש. אם חסר לך מידע כדי לענות — " +
            "אמרי זאת ובקשי הבהרה, ואל תמציאי נתונים, סכומים או שמות. " +
            "אל תבקשי ואל תשתמשי בפרטים מזהים של ילדים או הורים.";

        private const string SafetyMessage =
            "מצטערת, לא אוכל לעזור עם הבקשה הזו. אפשר לנסח אותה אחרת 🙂";

        // פרומפט ייעודי לחילוץ מוצרים מקטלוג (לא ה-persona של העוזרת). דורש JSON נקי.
        private const string ExtractSystemPrompt =
            "אתה מחלץ מוצרים מטקסט של קטלוג ספק. החזר אך ורק מערך JSON, בלי שום טקסט נוסף. " +
            "כל פריט במערך: {\"name\": string, \"description\": string, \"price\": number}. " +
            "name = שם המוצר (חובה, לא ריק). " +
            "description = פירוט קצר של המוצר אם קיים בטקסט, אחרת מחרוזת ריקה. " +
            "price = המחיר בשקלים כמספר בלבד (0 אם אין מחיר). " +
            "התעלם משורות שאינן מוצרים: כותרות, שמות קטגוריות, מספרי עמודים, פרטי קשר וכתובות. " +
            "אל תמציא מוצרים, מחירים או פרטים שאינם מופיעים בטקסט.";

        private readonly HttpClient _http;
        private readonly ILogger<AiService> _logger;
        private readonly string? _apiKey;
        private readonly string _model;

        public AiService(HttpClient http, IConfiguration config, ILogger<AiService> logger)
        {
            _http = http;
            _logger = logger;
            _apiKey = config["Gemini:ApiKey"];
            // דגם flash — מהיר וזמין במסלול החינמי; ניתן להחליף במשתנה סביבה בלי שינוי קוד
            _model = config["Gemini:Model"] ?? "gemini-2.5-flash";
        }

        public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

        public async Task<string> AskAsync(string question, string? context)
        {
            var userText = string.IsNullOrWhiteSpace(context)
                ? question
                : $"רקע (נתונים כלליים בלבד, בלי שמות): {context}\n\nהשאלה: {question}";

            var payload = new
            {
                systemInstruction = new { parts = new[] { new { text = SystemPrompt } } },
                contents = new[]
                {
                    new { role = "user", parts = new[] { new { text = userText } } },
                },
                // בלי maxOutputTokens — התשובה יכולה להיות באורך מלא (עד תקרת הדגם),
                // בלי חיתוך באמצע (בקשת בעלת המוצר, 09.07.2026).
            };

            var body = await PostGeminiAsync(payload);
            return ExtractAnswer(body);
        }

        // חילוץ מוצרים מטקסט קטלוג: מבקשים מ-Gemini מערך JSON נקי ומפרסרים אותו.
        // אין persona של העוזרת — פרומפט ייעודי, מצב JSON, וטמפרטורה 0 ליציבות.
        public async Task<List<ExtractedProductDto>> ExtractProductsAsync(string catalogText)
        {
            if (string.IsNullOrWhiteSpace(catalogText))
            {
                return new List<ExtractedProductDto>();
            }

            var payload = new
            {
                systemInstruction = new { parts = new[] { new { text = ExtractSystemPrompt } } },
                contents = new[]
                {
                    new { role = "user", parts = new[] { new { text = catalogText } } },
                },
                generationConfig = new { responseMimeType = "application/json", temperature = 0.0 },
            };

            var body = await PostGeminiAsync(payload);
            var json = ExtractAnswer(body);
            return ParseProducts(json);
        }

        // חילוץ מוצרים מתמונת קטלוג (צילום) — Gemini "רואה" את התמונה (inlineData)
        // וקורא ממנה את המוצרים ישירות, בלי תלות בחילוץ טקסט (מדויק גם בעברית/RTL).
        public async Task<List<ExtractedProductDto>> ExtractProductsFromImageAsync(
            string base64Data, string mimeType)
        {
            if (string.IsNullOrWhiteSpace(base64Data))
            {
                return new List<ExtractedProductDto>();
            }
            var mime = string.IsNullOrWhiteSpace(mimeType) ? "image/jpeg" : mimeType;

            var payload = new
            {
                systemInstruction = new { parts = new[] { new { text = ExtractSystemPrompt } } },
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new object[]
                        {
                            new { text = "לפניך תמונה של קטלוג ספק. חלץ ממנה את המוצרים." },
                            new { inlineData = new { mimeType = mime, data = base64Data } },
                        },
                    },
                },
                generationConfig = new { responseMimeType = "application/json", temperature = 0.0 },
            };

            var body = await PostGeminiAsync(payload);
            var json = ExtractAnswer(body);
            return ParseProducts(json);
        }

        // קריאה ל-Gemini (generateContent) והחזרת גוף התשובה הגולמי. משותף לכל הפעולות.
        private async Task<string> PostGeminiAsync(object payload)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent";
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("x-goog-api-key", _apiKey);
            request.Content = new StringContent(
                JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            using var response = await _http.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                // לא כותבים את גוף התשובה ללוג — עלול להכיל מידע רגיש
                _logger.LogError("Gemini API returned {Status}", (int)response.StatusCode);
                throw new HttpRequestException("AI request failed");
            }

            return body;
        }

        // מפרסר את מערך ה-JSON שהמודל החזיר לרשימת מוצרים, בסלחנות (מדלג על פריטים פגומים).
        private static List<ExtractedProductDto> ParseProducts(string json)
        {
            var list = new List<ExtractedProductDto>();
            if (string.IsNullOrWhiteSpace(json))
            {
                return list;
            }

            // אם המודל עטף את המערך בטקסט/בלוק קוד — לוקחים מה-[ הראשון עד ה-] האחרון.
            var start = json.IndexOf('[');
            var end = json.LastIndexOf(']');
            if (start < 0 || end <= start)
            {
                return list;
            }
            var arrayText = json.Substring(start, end - start + 1);

            try
            {
                using var doc = JsonDocument.Parse(arrayText);
                if (doc.RootElement.ValueKind != JsonValueKind.Array)
                {
                    return list;
                }
                foreach (var el in doc.RootElement.EnumerateArray())
                {
                    if (el.ValueKind != JsonValueKind.Object)
                    {
                        continue;
                    }
                    var name = el.TryGetProperty("name", out var n) && n.ValueKind == JsonValueKind.String
                        ? (n.GetString() ?? string.Empty).Trim()
                        : string.Empty;
                    if (name.Length == 0)
                    {
                        continue;
                    }
                    var desc = el.TryGetProperty("description", out var d) && d.ValueKind == JsonValueKind.String
                        ? (d.GetString() ?? string.Empty).Trim()
                        : string.Empty;
                    decimal price = 0m;
                    if (el.TryGetProperty("price", out var p))
                    {
                        if (p.ValueKind == JsonValueKind.Number)
                        {
                            p.TryGetDecimal(out price);
                        }
                        else if (p.ValueKind == JsonValueKind.String)
                        {
                            var digits = new string((p.GetString() ?? string.Empty)
                                .Where(c => char.IsDigit(c) || c == '.').ToArray());
                            decimal.TryParse(digits, NumberStyles.Any,
                                CultureInfo.InvariantCulture, out price);
                        }
                    }
                    list.Add(new ExtractedProductDto
                    {
                        Name = name,
                        Description = desc,
                        Price = price,
                    });
                }
            }
            catch (JsonException)
            {
                // JSON לא תקין — מחזירים מה שהצלחנו (ייתכן ריק); הפרונט ייפול חזרה לחילוץ מקומי.
            }

            return list;
        }

        // מחלץ את הטקסט מתשובת Gemini; מטפל גם בחסימת בטיחות (blockReason / finishReason=SAFETY)
        private static string ExtractAnswer(string body)
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            // חסימת בטיחות ברמת הבקשה
            if (root.TryGetProperty("promptFeedback", out var feedback) &&
                feedback.TryGetProperty("blockReason", out _))
            {
                return SafetyMessage;
            }

            if (root.TryGetProperty("candidates", out var candidates) &&
                candidates.ValueKind == JsonValueKind.Array &&
                candidates.GetArrayLength() > 0)
            {
                var first = candidates[0];

                // חסימת בטיחות ברמת התשובה
                if (first.TryGetProperty("finishReason", out var finish) &&
                    finish.GetString() == "SAFETY")
                {
                    return SafetyMessage;
                }

                var sb = new StringBuilder();
                if (first.TryGetProperty("content", out var content) &&
                    content.TryGetProperty("parts", out var parts) &&
                    parts.ValueKind == JsonValueKind.Array)
                {
                    foreach (var part in parts.EnumerateArray())
                    {
                        if (part.TryGetProperty("text", out var text))
                        {
                            sb.Append(text.GetString());
                        }
                    }
                }

                var answer = sb.ToString().Trim();
                if (!string.IsNullOrEmpty(answer))
                {
                    return answer;
                }
            }

            return "לא התקבלה תשובה. נסי שוב בעוד רגע.";
        }
    }
}
