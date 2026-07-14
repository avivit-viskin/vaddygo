import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { loadUpcomingMonth, whenText } from "../../services/upcomingMonth";
import "../../styles/upcoming.css";

/*
  UpcomingMonth — התזכורות במסך המתנות: חגים (עד שבועיים לפני) וימי הולדת
  של הצוות והילדים (עד שבוע לפני). אם אין כלום — לא מוצג.
*/
function UpcomingMonth() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadUpcomingMonth().then((list) => {
      if (!cancelled) {
        setItems(list);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items || items.length === 0) {
    return null;
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
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default UpcomingMonth;
