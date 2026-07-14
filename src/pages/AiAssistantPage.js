import { useEffect, useRef, useState } from "react";
import { askAssistant } from "../services/aiService";
import { whatsappShareUrl, extractShareMessage } from "../services/whatsapp";
import Card from "../components/Card";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import BrandName from "../components/BrandName";
import "../styles/ai.css";

/*
  AiAssistantPage — עוזרת ה-AI (UI_SPEC ס' 14) כשיחה: צ'יפים לשאלות מהירות,
  שרשור הודעות (שאלה ← תשובה), ואפשרות *להגיב* ולהמשיך לשוחח. כל הודעה נשלחת
  עם תמצית השיחה עד כה כ"רקע", כדי שהעוזרת תזכור את ההקשר (בלי שינוי בשרת).
  פרטיות: נשלח רק הטקסט של השיחה — לא שמות/טלפונים.
*/
const QUICK_PROMPTS = [
  "תעזור לי לחשוב על מתנות לחג הקרוב",
  "תתן לי המלצה על ספק באזור מגוריי",
  "כמה תקציב אתה חושב שכדאי לי להשקיע על מתנות סוף שנה",
  "תעזור לי לנסח הודעה להורים על תזכורת תשלום",
];

/* תמצית השיחה עד כה, כרקע לשאלה הבאה (מוגבל באורך — השרת מגביל ל-2000 תווים) */
function buildContext(history) {
  if (history.length === 0) {
    return "";
  }
  const transcript = history
    .map((m) => `${m.role === "user" ? "המשתמשת" : "העוזרת"}: ${m.text}`)
    .join("\n");
  const capped =
    transcript.length > 1800 ? transcript.slice(-1800) : transcript;
  return `השיחה עד כה:\n${capped}`;
}

function AiAssistantPage() {
  const [messages, setMessages] = useState([]); // { role: "user" | "assistant", text }
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const threadEndRef = useRef(null);

  // גלילה אוטומטית לתחתית השיחה כשמתווספת הודעה (scrollIntoView לא קיים בכל סביבה)
  useEffect(() => {
    threadEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) {
      return;
    }
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setDraft("");
    setIsLoading(true);
    setError("");
    try {
      const result = await askAssistant(trimmed, buildContext(history));
      setMessages((prev) => [...prev, { role: "assistant", text: result.answer }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    send(draft);
  }

  const hasConversation = messages.length > 0;

  return (
    <div className="ai-page">
      <Card>
        <h2 className="ai-page__title">
          <BrandName /> — במה ברצונך לעזור? 💬
        </h2>
        <p className="ai-page__subtitle">
          אני כאן לעזור לנסח הודעות להורים, לתת רעיונות ולענות על שאלות. אפשר גם
          להגיב לי ולהמשיך לשוחח 🙂
        </p>

        <div className="ai-chips">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="ai-chip"
              onClick={() => send(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>

        {hasConversation && (
          <ul className="ai-thread" aria-label="שיחה עם העוזרת">
            {messages.map((message, index) => (
              <li
                key={index}
                className={`ai-bubble ai-bubble--${message.role}`}
              >
                <p className="ai-bubble__text">{message.text}</p>
                {message.role === "assistant" && (
                  <a
                    className="ai-bubble__share"
                    href={whatsappShareUrl(extractShareMessage(message.text))}
                    target="_blank"
                    rel="noreferrer"
                  >
                    שיתוף בוואטסאפ 💬
                  </a>
                )}
              </li>
            ))}
            {isLoading && (
              <li className="ai-bubble ai-bubble--assistant">
                <p className="ai-bubble__text ai-bubble__text--typing">
                  העוזרת כותבת…
                </p>
              </li>
            )}
            <li ref={threadEndRef} />
          </ul>
        )}

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="ai-form">
          <label className="field__label" htmlFor="ai-question">
            {hasConversation ? "התגובה שלך" : "השאלה שלך"}
          </label>
          <textarea
            id="ai-question"
            className="ai-textarea"
            rows={3}
            placeholder={
              hasConversation
                ? "אפשר להגיב, לבקש לקצר, או לשאול משהו נוסף…"
                : "למשל: יש לי 1,200 ₪ לחנוכה, אילו מתנות כדאי לקנות?"
            }
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit" isLoading={isLoading} disabled={!draft.trim()}>
            שליחה
          </Button>
        </form>
      </Card>

      {isLoading && !hasConversation && <Spinner text="העוזרת חושבת..." />}
    </div>
  );
}

export default AiAssistantPage;
