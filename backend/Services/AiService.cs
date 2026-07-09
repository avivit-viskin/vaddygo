using System.Text;
using System.Text.Json;

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
            "כתבי בעברית בניסוח אנושי, חם ונעים — כאילו כתבה חברה טובה בוועד, לא מכונה. " +
            "שלבי אמוג'ים ולבבות בטבעיות (למשל 😊💜🙏🎉🌸) כדי לרכך ולחמם, בלי להגזים. " +
            "הטון תמיד מזמין, מכבד ולא תוקפני — גם בתזכורת תשלום נסחי בעדינות ובחיוך. " +
            "הרחיבי כמה שהשאלה דורשת. אם חסר לך מידע כדי לענות — אמרי זאת ובקשי הבהרה, " +
            "ואל תמציאי נתונים, סכומים או שמות. אל תבקשי ואל תשתמשי בפרטים מזהים של ילדים או הורים.";

        private const string SafetyMessage =
            "מצטערת, לא אוכל לעזור עם הבקשה הזו. אפשר לנסח אותה אחרת 🙂";

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

            return ExtractAnswer(body);
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
