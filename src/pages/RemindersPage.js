import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { getStudents } from "../services/studentsService";
import {
  getAllPaymentSummaries,
  buildWhatsappReminderUrl,
} from "../services/paymentsService";
import {
  getCadenceDays,
  setCadenceDays,
  markReminded,
  daysSinceReminded,
  isDue,
} from "../services/reminderSchedule";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import Icon from "../components/Icon";
import Select from "../components/Select";
import "../styles/reminders.css";

/*
  RemindersPage (/reminders) — פיצ'ר פרו: תזכורות אוטומטיות.
  המערכת עוקבת מי מההורים שטרם שילמו כבר "מחכה לתזכורת" (מעולם לא תוזכר, או שעבר
  מרווח התזמון מאז האחרונה), ומציגה רשימה מוכנה — המשתמשת רק לוחצת שליחה (וואטסאפ),
  והמערכת מסמנת ומחשבת את התזכורת הבאה. הלוג נשמר מקומית ושורד רענון.
*/
const DEFAULT_MESSAGE = [
  "שלום :)",
  "רק תזכורת קטנה לגבי התשלום לגן שטרם הוסדר.",
  "נשמח שתטפלו בזה בהקדם — תודה רבה!",
].join("\n");

const CADENCE_OPTIONS = [
  { value: 3, label: "כל 3 ימים" },
  { value: 7, label: "כל שבוע" },
  { value: 14, label: "כל שבועיים" },
];

function RemindersPage() {
  const { data: students, isLoading } = useApi(getStudents);
  const [summaries, setSummaries] = useState({});
  const [cadence, setCadence] = useState(getCadenceDays());
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  // מזנק רינדור אחרי כל שליחה כדי לחשב מחדש מי עדיין "מחכה לתזכורת"
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    if (!students || students.length === 0) {
      setSummaries({});
      return undefined;
    }
    let cancelled = false;
    getAllPaymentSummaries()
      .then((list) => {
        if (cancelled) return;
        const next = {};
        list.forEach((s) => {
          next[s.studentId] = s;
        });
        setSummaries(next);
      })
      .catch(() => {
        if (!cancelled) setSummaries({});
      });
    return () => {
      cancelled = true;
    };
  }, [students]);

  const debtors = useMemo(
    () => (students || []).filter((s) => summaries[s.id]?.hasUnpaid),
    [students, summaries]
  );

  // מחושבים בכל רינדור (קריאת isDue זולה); forceRefresh מרנדר מחדש אחרי שליחה.
  const dueNow = debtors.filter((s) => isDue(s.id, cadence));
  const handled = debtors.filter((s) => !isDue(s.id, cadence));

  function changeCadence(days) {
    setCadence(days);
    setCadenceDays(days);
  }

  function handleSent(studentId) {
    markReminded(studentId);
    forceRefresh((n) => n + 1);
  }

  if (isLoading) {
    return <Spinner text="בודקים מי מחכה לתזכורת..." />;
  }

  return (
    <div className="reminders-page">
      <div className="page-header">
        <h2>תזכורות אוטומטיות</h2>
        <Link to="/">
          <Button variant="secondary">
            <Icon name="home" size={16} /> חזרה
          </Button>
        </Link>
      </div>

      <p className="reminders-intro">
        המערכת עוקבת מי מההורים שטרם שילמו כבר מחכה לתזכורת — ואת רק לוחצת שליחה.
        אחרי שליחה, ההורה יחזור לרשימה רק כשיגיע מועד התזכורת הבא.
      </p>

      <div className="reminders-controls">
        <Select
          id="reminders-cadence"
          label="כל כמה זמן לתזכר"
          value={cadence}
          onChange={(e) => changeCadence(Number(e.target.value))}
        >
          {CADENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      <label className="field__label" htmlFor="reminders-message">
        ההודעה שתישלח (אפשר לערוך)
      </label>
      <textarea
        id="reminders-message"
        className="reminders-textarea"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      {debtors.length === 0 ? (
        <EmptyState icon="🎉" message="כל ההורים שילמו — אין למי לתזכר!" />
      ) : (
        <>
          <section className="reminders-section">
            <h3 className="reminders-section__title reminders-section__title--due">
              מחכים לתזכורת עכשיו ({dueNow.length})
            </h3>
            {dueNow.length === 0 ? (
              <p className="reminders-empty">
                כרגע אף אחד — כולם תוזכרו לאחרונה. 👌
              </p>
            ) : (
              <ul className="reminders-list">
                {dueNow.map((s) => {
                  const since = daysSinceReminded(s.id);
                  return (
                    <li key={s.id} className="reminders-item reminders-item--due">
                      <div>
                        <span className="reminders-item__name">
                          {s.firstName} {s.lastName}
                        </span>
                        <span className="reminders-item__meta">
                          {since === null
                            ? "טרם תוזכר"
                            : `תוזכר לפני ${since} ימים`}
                        </span>
                      </div>
                      <a
                        href={buildWhatsappReminderUrl(
                          s.parentPhoneNumber,
                          message
                        )}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handleSent(s.id)}
                      >
                        <Button variant="brand">
                          <Icon name="message" size={15} /> שליחה
                        </Button>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {handled.length > 0 && (
            <section className="reminders-section">
              <h3 className="reminders-section__title">
                תוזכרו לאחרונה ({handled.length})
              </h3>
              <ul className="reminders-list">
                {handled.map((s) => {
                  const since = daysSinceReminded(s.id);
                  return (
                    <li key={s.id} className="reminders-item reminders-item--done">
                      <div>
                        <span className="reminders-item__name">
                          {s.firstName} {s.lastName}
                        </span>
                        <span className="reminders-item__meta">
                          <Icon name="check" size={13} /> תוזכר לפני {since} ימים
                        </span>
                      </div>
                      <a
                        href={buildWhatsappReminderUrl(
                          s.parentPhoneNumber,
                          message
                        )}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handleSent(s.id)}
                      >
                        <Button variant="secondary">שליחה חוזרת</Button>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default RemindersPage;
