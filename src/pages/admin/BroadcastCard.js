import { useCallback, useState } from "react";
import Card from "../../components/Card";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";
import useApi from "../../hooks/useApi";
import {
  getBroadcastRecipients,
  sendBroadcast,
  PRO_ANNOUNCEMENT,
  INCOMPLETE_NUDGE,
  SUPPLIER_CATALOG_REMINDER,
} from "../../services/subscriptionsService";
import "../../styles/broadcast.css";

/*
  BroadcastCard — שליחת עדכון אחד במייל לקהל שנבחר.

  שני קהלים:
  • **בעלי מוסדות** — מי שהקים גן (עדכונים על מסלול, מדיניות וכו').
  • **נרשמו ולא סיימו** — מי שנרשם אך עוד לא הקים גן (לעודד לחזור ולהשלים).

  מייל הוא הערוץ היחיד שמגיע לכולם (מספרי וואטסאפ אינם נשמרים). כל ההגנות
  נשמרות: מספר הנמענים מוצג לפני השליחה, אישור בשני שלבים (אין Undo למייל),
  והנוסח פתוח לעריכה (ברירת מחדל מתאימה לכל קהל).
*/
const DEFAULTS = {
  owners: PRO_ANNOUNCEMENT,
  incomplete: INCOMPLETE_NUDGE,
  suppliers: SUPPLIER_CATALOG_REMINDER,
};

const AUDIENCES = [
  { key: "owners", label: "כל בעלי המוסדות", noun: "בעלי מוסדות" },
  { key: "incomplete", label: "נרשמו ולא סיימו הרשמה", noun: "שנרשמו ולא סיימו" },
  { key: "suppliers", label: "כל הספקים", noun: "ספקים" },
];

function BroadcastCard() {
  const [audience, setAudience] = useState("owners");
  const { data, isLoading } = useApi(
    useCallback(() => getBroadcastRecipients(audience), [audience])
  );
  const [subject, setSubject] = useState(DEFAULTS.owners.subject);
  const [body, setBody] = useState(DEFAULTS.owners.body);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const count = data?.count ?? 0;
  const meta = AUDIENCES.find((a) => a.key === audience) || AUDIENCES[0];

  function changeAudience(next) {
    if (next === audience) return;
    // אם הנוסח עדיין ברירת-מחדל של אחד הקהלים (לא נערך ידנית) — מחליפים
    // לברירת המחדל של הקהל החדש. אם המשתמשת ערכה בעצמה — לא דורסים.
    const untouched = Object.values(DEFAULTS).some(
      (d) => subject === d.subject && body === d.body
    );
    if (untouched) {
      setSubject(DEFAULTS[next].subject);
      setBody(DEFAULTS[next].body);
    }
    setConfirming(false);
    setResult(null);
    setError("");
    setAudience(next);
  }

  async function handleSend() {
    setSending(true);
    setError("");
    setResult(null);
    try {
      const res = await sendBroadcast({
        subject: subject.trim(),
        body: body.trim(),
        audience,
      });
      setResult(res);
      setConfirming(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card
      title={
        <>
          <Icon name="message" size={20} /> שליחת עדכון במייל
        </>
      }
    >
      {/* בחירת קהל היעד */}
      <div
        className="broadcast__audience"
        role="radiogroup"
        aria-label="קהל היעד"
      >
        {AUDIENCES.map((a) => (
          <button
            key={a.key}
            type="button"
            role="radio"
            aria-checked={audience === a.key}
            className={`broadcast__audience-btn${
              audience === a.key ? " broadcast__audience-btn--active" : ""
            }`}
            onClick={() => changeAudience(a.key)}
          >
            {a.label}
          </button>
        ))}
      </div>

      <p className="broadcast__hint">
        {audience === "incomplete"
          ? "נשלח במייל למי שנרשם אך עוד לא הקים גן — לעודד אותם לחזור ולהשלים."
          : audience === "suppliers"
          ? "נשלח במייל לכל הספקים הרשומים — למשל תזכורת לרענן את הקטלוג ולהוסיף מוצרים."
          : "נשלח במייל לכל מי שיש לו מוסד במערכת."}{" "}
        מספרי וואטסאפ אינם נשמרים אצלנו, ולכן מייל הוא הערוץ היחיד שמגיע לכולם.
      </p>

      {isLoading ? (
        <Spinner />
      ) : (
        <p className="broadcast__count">
          יישלח ל-<strong>{count}</strong> {meta.noun}
        </p>
      )}

      <label className="broadcast__label" htmlFor="broadcast-subject">
        נושא
      </label>
      <input
        id="broadcast-subject"
        className="broadcast__input"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      <label className="broadcast__label" htmlFor="broadcast-body">
        תוכן ההודעה
      </label>
      <textarea
        id="broadcast-body"
        className="broadcast__body"
        rows={14}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      {/* אישור בשני שלבים — אין דרך לבטל מייל שיצא */}
      {confirming ? (
        <div className="broadcast__confirm">
          <p className="broadcast__warn">
            לשלוח עכשיו ל-<strong>{count}</strong> {meta.noun}? אי אפשר לבטל
            מייל שנשלח.
          </p>
          <div className="broadcast__actions">
            <Button onClick={handleSend} isLoading={sending}>
              כן, לשלוח ל-{count}
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              ביטול
            </Button>
          </div>
        </div>
      ) : (
        <div className="broadcast__actions">
          <Button
            onClick={() => {
              setConfirming(true);
              setResult(null);
              setError("");
            }}
            disabled={!subject.trim() || !body.trim() || count === 0}
          >
            <Icon name="message" size={15} /> שליחה ל-{meta.noun}
          </Button>
        </div>
      )}

      {error && <p className="settings__error">{error}</p>}
      {result && (
        <p className={result.failed > 0 ? "broadcast__partial" : "settings__success"}>
          נשלחו <strong>{result.sent}</strong> מתוך {result.total}
          {result.failed > 0 && <> · {result.failed} נכשלו</>}
        </p>
      )}
    </Card>
  );
}

export default BroadcastCard;
