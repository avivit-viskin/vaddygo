import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { loadUpcomingMonth, whenText } from "../../services/upcomingMonth";
import { isDismissed, dismissNotice } from "../../services/dismissedNotices";
import "../../styles/upcoming.css";

/*
  UpcomingMonth — התזכורות במסך המתנות: חגים (עד שבועיים לפני) וימי הולדת
  של הצוות והילדים (עד שבוע לפני). אפשר להסתיר כל תזכורת ב-X (נשמר). אם אין
  כלום (או שהוסתרו כולן) — לא מוצג.
*/
function UpcomingMonth() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadUpcomingMonth().then((list) => {
      if (!cancelled) {
        setItems(list.filter((it) => !isDismissed(`upcoming:${it.id}`)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items || items.length === 0) {
    return null;
  }

  function handleDismiss(id) {
    dismissNotice(`upcoming:${id}`);
    setItems((list) => list.filter((it) => it.id !== id));
  }

  return (
    <Card title="מה מתקרב 🗓️">
      <ul className="upcoming">
        {items.map((it) => (
          <li key={it.id} className="upcoming__item">
            <span className="upcoming__icon" aria-hidden="true">
              {it.icon}
            </span>
            <span className="upcoming__label">{it.label}</span>
            <span className="upcoming__when">{whenText(it.daysUntil)}</span>
            <button
              type="button"
              className="upcoming__dismiss"
              aria-label={`הסתרת ההתראה: ${it.label}`}
              onClick={() => handleDismiss(it.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default UpcomingMonth;
