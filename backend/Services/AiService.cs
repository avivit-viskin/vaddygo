using System.Text;
using System.Text.Json;

namespace ParentCommitteeAPI.Services
{
    /*
      AiService — עוזרת ה-AI של VaadyGo. קוראת ל-Claude (Anthropic Messages API)
      דרך HttpClient. מפתח ה-API מגיע ממשתני סביבה בלבד (Anthropic:ApiKey) —
      לעולם לא בקוד. הדגם הוא claude-opus-4-8 כברירת מחדל.
      פרטיות: לא נשלחים לבינה שמות/טלפונים של ילדים או הורים — רק שאלה ורקע כללי.
    */
    public class AiService : IAiService
    {
        private const string ApiUrl = "https://api.anthropic.com/v1/messages";

        // ה-persona והכללים של העוזרת. עברית, טון חם, בלי להמציא נתונים ובלי מידע מזהה.
        private const string SystemPrompt =
            "את העוזרת החכמה של VaadyGo — מערכת לניהול ועד הורים בגנים ובבתי ספר. " +
            "התפקיד שלך לעזור לחברות הוועד: לנסח הודעות להורים (תזכורות תשלום, הזמנות " +
            "לאירועים, עדכונים), לתת רעיונות (למשל למתנות ולחגים) ולעזור להבין את מצב הוועד. " +
            "עני תמיד בעברית, בטון חם ומכבד, בקצרה ולעניין. אם חסר לך מידע כדי לענות — " +
            "אמרי זאת ובקשי הבהרה, ואל תמציאי נתונים, סכומים או שמות. " +
            "אל תבקשי ואל תשתמשי בפרטים מזהים של ילדים או הורים.";

        private readonly HttpClient _http;
        private readonly ILogger<AiService> _logger;
        private readonly string? _apiKey;
        private readonly string _model;

        public AiService(HttpClient http, IConfiguration config, ILogger<AiService> logger)
        {
            _http = http;
            _logger = logger;
            _apiKey = config["Anthropic:ApiKey"];
            _model = config["Anthropic:Model"] ?? "claude-opus-4-8";
        }

        public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

        public async Task<string> AskAsync(string question, string? context)
        {
            var userText = string.IsNullOrWhiteSpace(context)
                ? question
                : $"רקע (נתונים כלליים בלבד, בלי שמות): {context}\n\nהשאלה: {question}";

            var payload = new
            {
                model = _model,
                max_tokens = 1024,
                system = SystemPrompt,
                messages = new[] { new { role = "user", content = userText } },
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, ApiUrl);
            request.Headers.Add("x-api-key", _apiKey);
            request.Headers.Add("anthropic-version", "2023-06-01");
            request.Content = new StringContent(
                JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            using var response = await _http.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                // לא כותבים את גוף התשובה ללוג — עלול להכיל מידע רגיש
                _logger.LogError("Anthropic API returned {Status}", (int)response.StatusCode);
                throw new HttpRequestException("AI request failed");
            }

            return ExtractAnswer(body);
        }

        // מחלץ את הטקסט מתשובת ה-API; מטפל גם בסירוב בטיחותי (stop_reason=refusal)
        private static string ExtractAnswer(string body)
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (root.TryGetProperty("stop_reason", out var stop) &&
                stop.GetString() == "refusal")
            {
                return "מצטערת, לא אוכל לעזור עם הבקשה הזו. אפשר לנסח אותה אחרת 🙂";
            }

            var sb = new StringBuilder();
            if (root.TryGetProperty("content", out var content) &&
                content.ValueKind == JsonValueKind.Array)
            {
                foreach (var block in content.EnumerateArray())
                {
                    if (block.TryGetProperty("type", out var type) &&
                        type.GetString() == "text" &&
                        block.TryGetProperty("text", out var text))
                    {
                        sb.Append(text.GetString());
                    }
                }
            }

            var answer = sb.ToString().Trim();
            return string.IsNullOrEmpty(answer)
                ? "לא התקבלה תשובה. נסי שוב בעוד רגע."
                : answer;
        }
    }
}
