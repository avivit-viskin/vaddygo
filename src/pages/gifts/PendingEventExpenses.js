import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import EventExpenseModal from "../home/EventExpenseModal";
import { formatDayMonth } from "../../services/format";
import {
  loadPassedForExpense,
  markExpensePrompted,
} from "../../services/passedEvents";

/*
  PendingEventExpenses — תזכורת במסך המתנות (משימה 25): אם אירוע/חג עבר והמשתמשת
  עדיין לא רשמה כמה כסף יצא (כי לא ראתה את הפופאפ בדף הבית), הוא ממתין כאן. לחיצה
  על "רישום הוצאה" פותחת את אותו חלון רישום. אחרי רישום — הפריט נעלם.
*/
function PendingEventExpenses({ onRecorded }) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadPassedForExpense().then((list) => {
      if (!cancelled) {
        setItems(list);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) {
    return null;
  }

  function handleRecorded(item) {
    markExpensePrompted(item.id);
    setItems((list) => list.filter((it) => it.id !== item.id));
    setActive(null);
    if (onRecorded) {
      onRecorded();
    }
  }

  return (
    <Card title="לרשום הוצאה? 🧾">
      <p className="pending-expenses__hint">
        אירועים שכבר עברו — כדאי לרשום כמה כסף יצא, כדי שיתרת הקופה תהיה מדויקת.
      </p>
      <ul className="pending-expenses__list">
        {items.map((item) => (
          <li key={item.id} className="pending-expenses__item">
            <span className="pending-expenses__name">
              {item.name}
              <span className="pending-expenses__date">
                {formatDayMonth(item.date)}
              </span>
            </span>
            <Button variant="secondary" onClick={() => setActive(item)}>
              רישום הוצאה
            </Button>
          </li>
        ))}
      </ul>
      {active && (
        <EventExpenseModal
          key={active.id}
          item={active}
          closeLabel="אחר כך"
          onClose={() => setActive(null)}
          onRecorded={handleRecorded}
        />
      )}
    </Card>
  );
}

export default PendingEventExpenses;
