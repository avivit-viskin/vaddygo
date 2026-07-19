import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import BrandName from "./BrandName";
import { isNewUser, clearNewUser } from "../services/authService";

/*
  WelcomePopup — פופאפ "ברוכים הבאים" שקופץ *רק למשתמש חדש* בכניסה הראשונה
  לאפליקציה. כאן מופיע הטקסט הרגשי (שהיה קודם במסך הפתיחה) + טיפ ניווט קצר.
  אחרי "הבנתי" לא קופץ שוב, ולמשתמש חוזר אינו מוצג כלל.
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
      <p className="welcome-popup__text">
        אנחנו יודעים כמה שעות אתם משקיעים — בלי תודה, בלי שכר, רק מתוך אהבה.
      </p>
      <p className="welcome-popup__text">
        עכשיו <BrandName /> לוקחת את העומס מהכתפיים שלכם: הגבייה קלה, יש שקיפות —
        ואתם סוף־סוף יכולים לנשום. 💜
      </p>
      <p className="welcome-popup__text">
        טיפ קטן: השתמשו בלשוניות שבתחתית המסך למעבר בין הגבייה, לוח החגים, המתנות
        והקבצים — ואל תשכחו את עוזרת ה-AI 🤖
      </p>
      <div style={{ marginTop: 14 }}>
        <Button onClick={close}>הבנתי, בואו נתחיל 🙂</Button>
      </div>
    </Modal>
  );
}

export default WelcomePopup;
