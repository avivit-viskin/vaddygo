import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { isNewUser, clearNewUser } from "../services/authService";

/*
  WelcomePopup — פופאפ "ברוכים הבאים" שקופץ *רק למשתמש חדש* (בכניסה הראשונה
  אחרי ההרשמה), מסביר בקצרה את הניווט בלשוניות ואת עוזרת ה-AI. אחרי "הבנתי"
  לא קופץ שוב, ולמשתמש חוזר אינו מוצג כלל.
*/
function WelcomePopup() {
  const [open, setOpen] = useState(isNewUser);

  function close() {
    clearNewUser();
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
