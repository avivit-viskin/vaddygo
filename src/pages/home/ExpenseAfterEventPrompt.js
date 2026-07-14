import { useEffect, useState } from "react";
import EventExpenseModal from "./EventExpenseModal";
import {
  loadPassedForExpense,
  markExpensePrompted,
} from "../../services/passedEvents";

/*
  ExpenseAfterEventPrompt — אחרי שאירוע/חג עבר (יום ומעלה), קופץ ושואל כמה כסף
  יצא (משימה 25). לא קופץ מיד בכניסה — רק אחרי כמה דקות שהמשתמשת באפליקציה, כדי
  לא להציק. אם לא ראתה — התזכורת ממתינה גם במסך המתנות. "דלג" לא ישאל שוב.
*/
const POPUP_DELAY_MS = 2 * 60 * 1000; // כ-2 דקות אחרי הכניסה, לא מיד

function ExpenseAfterEventPrompt({ onRecorded, delayMs = POPUP_DELAY_MS }) {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    let cancelled = false;
    // מציגים רק אחרי השהיה — כדי לא לקפוץ מיד ברגע שנכנסים
    const timer = setTimeout(() => {
      loadPassedForExpense().then((list) => {
        if (!cancelled) {
          setQueue(list);
        }
      });
    }, delayMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [delayMs]);

  const current = queue[0];
  if (!current) {
    return null;
  }

  // "דלג"/סגירה — מסמנים שנשאלנו (לא נשאל שוב) ועוברים לפריט הבא
  function goNext() {
    markExpensePrompted(current.id);
    setQueue((q) => q.slice(1));
  }

  function handleRecorded() {
    if (onRecorded) {
      onRecorded();
    }
    goNext();
  }

  return (
    <EventExpenseModal
      key={current.id}
      item={current}
      onClose={goNext}
      onRecorded={handleRecorded}
    />
  );
}

export default ExpenseAfterEventPrompt;
