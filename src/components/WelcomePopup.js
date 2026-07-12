import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";

const SEEN_KEY = "vaadygo.welcomeSeen";

/*
  WelcomePopup — פופאפ "ברוכים הבאים" שקופץ בכניסה לאפליקציה, מסביר בקצרה
  את הניווט בלשוניות ואת עוזרת ה-AI. אחרי "הבנתי" לא קופץ שוב (נשמר ב-localStorage).
*/
function WelcomePopup() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(SEEN_KEY) !== "1";
    } catch {
      return true;
    }
  });

  function close() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // אם ה-storage חסום — פשוט סוגרים לפגישה הזו
    }
    setOpen(false);
  }

  return (
    <Modal
      isOpen={open}
      onClose={close}
      title="ברוכים הבאים לפורטל ניהול ועד ההורים 💜"
    >
      <p className="welcome-popup__text">האפליקציה מותאמת בצורה מושלמת לנייד.</p>
      <p className="welcome-popup__text">
        השתמשו בלשוניות שבתחתית המסך למעבר מהיר בין ניהול הגבייה, לוח החגים,
        ספקים והתממשקות לדרייב.
      </p>
      <p className="welcome-popup__text">
        ואל תשכחו להיעזר ב-AI שלנו לניצול מלא של רעיונות וחיסכון של זמן 🤖
      </p>
      <div style={{ marginTop: 14 }}>
        <Button onClick={close}>הבנתי, בואו נתחיל 🙂</Button>
      </div>
    </Modal>
  );
}

export default WelcomePopup;
