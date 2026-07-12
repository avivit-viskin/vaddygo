import { useEffect, useRef } from "react";
import Modal from "../../components/Modal";

/*
  NotificationsPanel — הפאנל שנפתח בלחיצה על הפעמון 🔔 במסך הבית.
  מציג את כל ההתראות עם אייקון מתאים; אפשר לסמן כל אחת כ"נקראה" (או את כולן),
  והן נשמרות מעומעמות. הפעמון סופר רק את מה שעוד לא נקרא.
  אם לא נוגעים בפאנל 15 שניות — הוא נסגר לבד (חוסר פעילות).
*/
const TYPE_ICONS = {
  payments: "💰",
  unpaid: "💰",
  birthday: "🎂",
  holiday: "🎉",
  event: "📅",
  gift: "🎁",
};

/* אחרי כמה זמן של חוסר פעילות לסגור את הפאנל לבד. */
const IDLE_CLOSE_MS = 15000;

/* פעילויות שמאפסות את שעון חוסר-הפעילות (מגע, גלילה, עכבר, מקלדת). */
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "touchmove",
  "scroll",
  "wheel",
  "click",
];

function NotificationsPanel({
  isOpen,
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
}) {
  // ref כדי להשתמש ב-onClose העדכני בלי להריץ מחדש את האפקט בכל רינדור
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // סגירה אוטומטית אחרי 15 שניות בלי פעילות; כל פעילות מאפסת את השעון.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onCloseRef.current(), IDLE_CLOSE_MS);
    };
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, resetTimer, true)
    );
    resetTimer(); // מתחילים את השעון ברגע הפתיחה
    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, resetTimer, true)
      );
    };
  }, [isOpen]);

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔔 ההתראות שלך">
      {notifications.length === 0 ? (
        <p className="notifications__empty">אין התראות כרגע — הכל מסודר! 🎉</p>
      ) : (
        <>
          {hasUnread && (
            <button
              type="button"
              className="notifications__mark-all"
              onClick={onMarkAllRead}
            >
              סמן הכל כנקרא
            </button>
          )}
          <ul className="notifications">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`notifications__item notifications__item--${n.type}${
                  n.read ? " notifications__item--read" : ""
                }`}
              >
                <span className="notifications__icon" aria-hidden="true">
                  {TYPE_ICONS[n.type] || "🔔"}
                </span>
                <span className="notifications__message">{n.message}</span>
                {n.read ? (
                  <span className="notifications__read-label">✓ נקרא</span>
                ) : (
                  <button
                    type="button"
                    className="notifications__mark"
                    aria-label={`סמן כנקרא: ${n.message}`}
                    onClick={() => onMarkRead(n.id)}
                  >
                    סמן כנקרא
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}

export default NotificationsPanel;
