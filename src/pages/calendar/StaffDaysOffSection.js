import { useState } from "react";
import useApi from "../../hooks/useApi";
import { getStaff } from "../../services/staffService";
import { addEvent, deleteEvent } from "../../services/eventsService";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Select from "../../components/Select";

/*
  StaffDaysOffSection — מדור "ימי חופש של אנשי הצוות" בלוח השנה (מתחת לראש חודש).
  מציג את ימי-החופש של החודש המוצג, ומאפשר להוסיף: בוחרים איש צוות מהרשימה
  שהוזנה (ימי הולדת הצוות) — או מקלידים שם ידנית — ותאריך. נשמר כאירוע עם
  category="staffDayOff", כך שהוא נפרד מהאירועים הרגילים בלוח.
*/
const CATEGORY = "staffDayOff";
const MANUAL = "__manual__";
const dateFmt = new Intl.DateTimeFormat("he", {
  day: "numeric",
  month: "numeric",
});

function StaffDaysOffSection({
  daysOff = [],
  readOnly = false,
  onChanged,
}) {
  const { data: staff } = useApi(getStaff);
  const [adding, setAdding] = useState(false);
  const [choice, setChoice] = useState(""); // שם איש הצוות שנבחר, או MANUAL
  const [manualName, setManualName] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const staffList = Array.isArray(staff) ? staff : [];
  const sorted = [...daysOff].sort((a, b) => a.date - b.date);

  function reset() {
    setChoice("");
    setManualName("");
    setDate("");
    setError("");
    setAdding(false);
  }

  async function handleAdd(event) {
    event.preventDefault();
    const name = (choice === MANUAL ? manualName : choice).trim();
    if (!name) {
      setError("צריך לבחור איש צוות או להקליד שם");
      return;
    }
    if (!date) {
      setError("צריך לבחור תאריך");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await addEvent({ name, eventDate: date, category: CATEGORY });
      reset();
      if (onChanged) onChanged();
    } catch {
      setError("לא הצלחנו לשמור. אפשר לנסות שוב.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    await deleteEvent(id);
    if (onChanged) onChanged();
  }

  return (
    <section className="calendar-list" aria-label="ימי חופש של הצוות">
      <h3>
        <Icon name="calendar" size={18} /> ימי חופש של הצוות
      </h3>
      <p className="calendar-list__hint">
        מסמנים כאן מתי אנשי הצוות בחופש — בוחרים איש צוות מהרשימה (מ"ימי הולדת
        הצוות") או מקלידים שם, ובוחרים תאריך.
      </p>

      {sorted.length === 0 && (
        <p className="calendar-list__hint" style={{ opacity: 0.75 }}>
          עדיין לא סומנו ימי חופש בחודש הזה.
        </p>
      )}

      {sorted.map((d) => (
        <div className="calendar-list__item" key={`dayoff-${d.id}`}>
          <span className="calendar-list__date">{dateFmt.format(d.date)}</span>
          <span className="calendar-list__name">
            <Icon name="users" size={14} /> {d.name}
          </span>
          {!readOnly && (
            <button
              type="button"
              className="calendar-list__send"
              aria-label={`מחיקת יום החופש של ${d.name}`}
              onClick={() => handleDelete(d.id)}
            >
              <Icon name="trash" size={16} /> מחיקה
            </button>
          )}
        </div>
      ))}

      {!readOnly && !adding && (
        <div style={{ marginTop: 10 }}>
          <Button variant="secondary" onClick={() => setAdding(true)}>
            + הוספת יום חופש
          </Button>
        </div>
      )}

      {!readOnly && adding && (
        <form onSubmit={handleAdd} style={{ marginTop: 10 }}>
          <Select
            id="staff-dayoff-who"
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
              id="staff-dayoff-manual"
              label="שם"
              placeholder="שם איש הצוות"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
            />
          )}

          <Input
            id="staff-dayoff-date"
            label="תאריך החופש"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {error && (
            <p className="field__error" role="alert">
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button type="submit" isLoading={busy}>
              הוספה
            </Button>
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
