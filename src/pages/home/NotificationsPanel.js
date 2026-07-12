import Modal from "../../components/Modal";

/*
  NotificationsPanel — הפאנל שנפתח בלחיצה על הפעמון 🔔 במסך הבית.
  מציג את כל ההתראות (מכל הסוגים) עם אייקון מתאים; כשאין — הודעה נעימה.
*/
const TYPE_ICONS = {
  payments: "💰",
  unpaid: "💰",
  birthday: "🎂",
  holiday: "🎉",
  event: "📅",
  gift: "🎁",
};

function NotificationsPanel({ isOpen, notifications, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔔 ההתראות שלך">
      {notifications.length === 0 ? (
        <p className="notifications__empty">אין התראות כרגע — הכל מסודר! 🎉</p>
      ) : (
        <ul className="notifications">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`notifications__item notifications__item--${n.type}`}
            >
              <span className="notifications__icon" aria-hidden="true">
                {TYPE_ICONS[n.type] || "🔔"}
              </span>
              <span>{n.message}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export default NotificationsPanel;
