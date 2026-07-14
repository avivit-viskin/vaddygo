import { useMemo, useState } from "react";
import { buildWhatsappReminderUrl } from "../services/paymentsService";
import Modal from "./Modal";
import Button from "./Button";
import Select from "./Select";
import "../styles/payments.css";

/*
  BulkReminderButton — תזכורת גורפת לכל ההורים שטרם שילמו.
  וואטסאפ לא שולח לכמה נמענים בקישור אחד, לכן נפתחת שיחה נפרדת לכל הורה:
  המשתמשת לוחצת "שליחה" ליד כל שם. ההודעה גנרית וניתנת לעריכה לפני השליחה.
  לחיצה על "שליחה" מסמנת את ההורה כ"נשלח" ומראה התקדמות — כדי לא לשלוח פעמיים.
*/
const DEFAULT_MESSAGE = [
  "שלום לך :)",
  "אנחנו עושים עכשיו מעבר על התשלומים לגן של השנה ואנחנו רואים שלא סיימת להסדיר את התשלום.",
  "נא לטפל בזה בהקדם האפשרי",
  "תודה !",
].join("\n");

function BulkReminderButton({ unpaidStudents, totalStudents = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sentIds, setSentIds] = useState(() => new Set());
  const [classFilter, setClassFilter] = useState("");

  // כיתות/קבוצות של החייבים — לסינון (מוצג רק כשיש יותר מאחת)
  const classNames = useMemo(
    () =>
      [...new Set(unpaidStudents.map((s) => s.className).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, "he")
      ),
    [unpaidStudents]
  );

  const shownStudents = classFilter
    ? unpaidStudents.filter((s) => s.className === classFilter)
    : unpaidStudents;
  const sentShown = shownStudents.filter((s) => sentIds.has(s.id)).length;

  function open() {
    // כל פתיחה מתחילה קמפיין נקי
    setSentIds(new Set());
    setMessage(DEFAULT_MESSAGE);
    setClassFilter("");
    setIsOpen(true);
  }

  function markSent(id) {
    setSentIds((prev) => new Set(prev).add(id));
  }

  return (
    <>
      <Button variant="secondary" onClick={open}>
        📣 תזכורת לחייבים
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="תזכורת לכל מי שטרם שילם"
      >
        {unpaidStudents.length === 0 ? (
          <p className="bulk-reminder__done">
            {totalStudents === 0
              ? "עדיין אין תלמידים ברשימה 🙂"
              : "כל ההורים שילמו! 🎉"}
          </p>
        ) : (
          <div className="bulk-reminder">
            <label className="field__label" htmlFor="bulk-message">
              ההודעה שתישלח (אפשר לערוך)
            </label>
            <textarea
              id="bulk-message"
              className="bulk-reminder__textarea"
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            {classNames.length > 1 && (
              <Select
                id="bulk-class-filter"
                label="סינון לפי כיתה/קבוצה"
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
              >
                <option value="">כל הכיתות</option>
                {classNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            )}
            <p className="bulk-reminder__note">
              וואטסאפ נפתח לכל הורה בנפרד — לוחצים "שליחה" ליד כל שם. נשלחו{" "}
              <strong>{sentShown}</strong> מתוך{" "}
              <strong>{shownStudents.length}</strong>.
            </p>
            <ul className="bulk-reminder__list">
              {shownStudents.map((student) => {
                const isSent = sentIds.has(student.id);
                return (
                  <li
                    key={student.id}
                    className={`bulk-reminder__item${
                      isSent ? " bulk-reminder__item--sent" : ""
                    }`}
                  >
                    <span>
                      {isSent && "✅ "}
                      {student.firstName} {student.lastName}
                    </span>
                    <a
                      className="bulk-reminder__send"
                      href={buildWhatsappReminderUrl(
                        student.parentPhoneNumber,
                        message
                      )}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => markSent(student.id)}
                    >
                      <Button variant="secondary">
                        {isSent ? "שליחה חוזרת" : "שליחה 💬"}
                      </Button>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}

export default BulkReminderButton;
