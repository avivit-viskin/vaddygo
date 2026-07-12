import Modal from "../../components/Modal";

/*
  NotificationsPanel — הפאנל שנפתח בלחיצה על הפעמון 🔔 במסך הבית.
  מציג את כל ההתראות עם אייקון מתאים; אפשר לסמן כל אחת כ"נקראה" (או את כולן),
  והן נשמרות מעומעמות. הפעמון סופר רק את מה שעוד לא נקרא.
*/
const TYPE_ICONS = {
  payments: "💰",
  unpaid: "💰",
  birthday: "🎂",
  holiday: "🎉",
  event: "📅",
  gift: "🎁",
};

function NotificationsPanel({
  isOpen,
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
}) {
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
