import { useState } from "react";
import useApi from "../../hooks/useApi";
import { getStaff } from "../../services/staffService";
import {
  getStaffWeeklyOff,
  addStaffWeeklyOff,
  removeStaffWeeklyOff,
  weekdayLabel,
  WEEKDAYS,
} from "../../services/staffWeeklyOffService";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Select from "../../components/Select";

/*
  StaffDaysOffSection — מדור "ימי חופש קבועים של הצוות" בלוח השנה (מתחת לראש חודש).
  לפי בקשת בעלת המוצר: לא תאריך בודד אלא יום קבוע בשבוע — למשל "בימי ראשון
  הגננת בחופש", "בימי שני הסייעת". בוחרים איש צוות (מרשימת הצוות או בהקלדה
  ידנית) + יום בשבוע, ואפשר להוסיף כמה אנשי צוות שרוצים.
*/
const MANUAL = "__manual__";

function StaffDaysOffSection({ readOnly = false }) {
  const { data: staff } = useApi(getStaff);
  const [entries, setEntries] = useState(() => getStaffWeeklyOff());
  const [adding, setAdding] = useState(false);
  const [choice, setChoice] = useState(""); // שם איש הצוות שנבחר, או MANUAL
  const [manualName, setManualName] = useState("");
  const [weekday, setWeekday] = useState("0");
  const [error, setError] = useState("");

  const staffList = Array.isArray(staff) ? staff : [];
  const sorted = [...entries].sort((a, b) => a.weekday - b.weekday);

  function refresh() {
    setEntries(getStaffWeeklyOff());
  }

  function reset() {
    setChoice("");
    setManualName("");
    setWeekday("0");
    setError("");
    setAdding(false);
  }

  function handleAdd(event) {
    event.preventDefault();
    const name = (choice === MANUAL ? manualName : choice).trim();
    if (!name) {
      setError("צריך לבחור איש צוות או להקליד שם");
      return;
    }
    addStaffWeeklyOff({ staffName: name, weekday });
    reset();
    refresh();
  }

  function handleDelete(id) {
    removeStaffWeeklyOff(id);
    refresh();
  }

  return (
    <section className="calendar-list" aria-label="ימי חופש קבועים של הצוות">
      <h3>
        <Icon name="calendar" size={18} /> ימי חופש קבועים של הצוות
      </h3>
      <p className="calendar-list__hint">
        מסמנים כאן איזה יום בשבוע כל איש צוות בחופש באופן קבוע — למשל: בימי ראשון
        הגננת, בימי שני הסייעת. כך מנהל/ת הוועד יודע/ת מראש. אפשר להוסיף כמה
        אנשי צוות שרוצים.
      </p>

      {sorted.length === 0 && (
        <p className="calendar-list__hint" style={{ opacity: 0.75 }}>
          עדיין לא סומנו ימי חופש קבועים.
        </p>
      )}

      {sorted.map((entry) => (
        <div className="calendar-list__item" key={`weekly-off-${entry.id}`}>
          <span className="calendar-list__date">
            בימי {weekdayLabel(entry.weekday)}
          </span>
          <span className="calendar-list__name">
            <Icon name="users" size={14} /> {entry.staffName} בחופש
          </span>
          {!readOnly && (
            <button
              type="button"
              className="calendar-list__send"
              aria-label={`מחיקת יום החופש הקבוע של ${entry.staffName}`}
              onClick={() => handleDelete(entry.id)}
            >
              <Icon name="trash" size={16} /> מחיקה
            </button>
          )}
        </div>
      ))}

      {!readOnly && !adding && (
        <div style={{ marginTop: 10 }}>
          <Button variant="secondary" onClick={() => setAdding(true)}>
            + הוספת איש צוות
          </Button>
        </div>
      )}

      {!readOnly && adding && (
        <form onSubmit={handleAdd} style={{ marginTop: 10 }}>
          <Select
            id="staff-weeklyoff-who"
            label="איש הצוות"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
          >
            <option value="">— בחירת איש צוות —</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.fullName}>
                {s.fullName}
                {s.role ? ` (${s.role})` : ""}
              </option>
            ))}
            <option value={MANUAL}>אחר / הקלדה ידנית…</option>
          </Select>

          {choice === MANUAL && (
            <Input
              id="staff-weeklyoff-manual"
              label="שם"
              placeholder="למשל: גננת / סייעת / שם פרטי"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
            />
          )}

          <Select
            id="staff-weeklyoff-day"
            label="באיזה יום בשבוע?"
            value={weekday}
            onChange={(e) => setWeekday(e.target.value)}
          >
            {WEEKDAYS.map((w) => (
              <option key={w.value} value={w.value}>
                יום {w.label}
              </option>
            ))}
          </Select>

          {error && (
            <p className="field__error" role="alert">
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button type="submit">הוספה</Button>
            <Button variant="secondary" onClick={reset}>
              ביטול
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

export default StaffDaysOffSection;
