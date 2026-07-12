import { useState } from "react";
import { askAssistant } from "../services/aiService";
import { whatsappShareUrl, extractShareMessage } from "../services/whatsapp";
import Card from "../components/Card";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import BrandName from "../components/BrandName";
import "../styles/ai.css";

/*
  AiAssistantPage — עוזרת ה-AI (UI_SPEC ס' 14): פתיח "במה ברצונך לעזור?",
  צ'יפים לשאלות מהירות, שדה שאלה חופשית, ותשובה עם מצבי טעינה/שגיאה.
  פרטיות: לא נשלחים לבינה שמות/טלפונים — רק הטקסט של השאלה.
*/
const QUICK_PROMPTS = [
  "רעיונות למתנה לחג הקרוב, בתקציב סביר",
  "עזרי לי לנסח תזכורת תשלום עדינה להורים",
  "עזרי לי לנסח הזמנה למסיבת סוף שנה",
  "טיפים לניהול תקציב הוועד בחגים",
];

function AiAssistantPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function ask(text) {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    setIsLoading(true);
    setError("");
    setAnswer("");
    try {
      const result = await askAssistant(trimmed);
      setAnswer(result.answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    ask(question);
  }

  function handleChip(prompt) {
    setQuestion(prompt);
    ask(prompt);
  }

  return (
    <div className="ai-page">
      <Card>
        <h2 className="ai-page__title">
          <BrandName /> — במה ברצונך לעזור? 💬
        </h2>
        <p className="ai-page__subtitle">
          אני כאן לעזור לנסח הודעות להורים, לתת רעיונות ולענות על שאלות.
        </p>

        <div className="ai-chips">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="ai-chip"
              onClick={() => handleChip(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="ai-form">
          <label className="field__label" htmlFor="ai-question">
            השאלה שלך
          </label>
          <textarea
            id="ai-question"
            className="ai-textarea"
            rows={4}
            placeholder="למשל: יש לי 1,200 ₪ לחנוכה, אילו מתנות כדאי לקנות?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <Button type="submit" isLoading={isLoading} disabled={!question.trim()}>
            שליחה לעוזרת
          </Button>
        </form>
      </Card>

      {isLoading && <Spinner text="העוזרת חושבת..." />}
      {error && <ErrorMessage message={error} />}
      {answer && (
        <Card title="התשובה של העוזרת">
          <p className="ai-answer">{answer}</p>
          <a
            className="ai-share"
            href={whatsappShareUrl(extractShareMessage(answer))}
            target="_blank"
            rel="noreferrer"
          >
            <Button>שתפי בוואטסאפ 💬</Button>
          </a>
          <p className="ai-share-note">משתף רק את ההודעה עצמה — בלי הפתיח והסיום של העוזרת</p>
        </Card>
      )}
    </div>
  );
}

export default AiAssistantPage;
