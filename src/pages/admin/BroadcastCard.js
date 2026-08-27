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
} from "../../services/subscriptionsService";
import "../../styles/broadcast.css";

/*
  BroadcastCard — שליחת עדכון אחד לכל בעלי המוסדות.

  קיים כי לא הייתה שום דרך להודיע לוועדים על שינוי חוץ מהעתקה ידנית לכל
  אחד. מספרי וואטסאפ אינם נשמרים במערכת, ולכן **מייל הוא הערוץ היחיד**
  שמגיע לכולם.

  שלוש החלטות ממשק, כולן נובעות מכך שזו פעולה שאי אפשר לבטל:

  1. **מספר הנמענים מוצג לפני השליחה**, ובאישור עצמו. "שלח לכולם" בלי לדעת
     לכמה זה בדיוק סוג הפעולה שמתחרטים עליה.
  2. **אישור בשני שלבים.** אין Undo למייל שיצא.
  3. **הנוסח פתוח לעריכה** ולא מקובע — ההודעה הבאה תהיה על משהו אחר, ואין
     סיבה שתדרוש פריסה חדשה.
*/
function BroadcastCard() {
  const { data, isLoading } = useApi(
    useCallback(() => getBroadcastRecipients(), [])
  );
  const [subject, setSubject] = useState(PRO_ANNOUNCEMENT.subject);
  const [body, setBody] = useState(PRO_ANNOUNCEMENT.body);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const count = data?.count ?? 0;

  async function handleSend() {
    setSending(true);
    setError("");
    setResult(null);
    try {
      const res = await sendBroadcast({ subject: subject.trim(), body: body.trim() });
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
          <Icon name="message" size={20} /> שליחת עדכון לכל בעלי המוסדות
        </>
      }
    >
      <p className="broadcast__hint">
        נשלח <strong>במייל</strong> לכל מי שיש לו מוסד במערכת. מספרי וואטסאפ
        אינם נשמרים אצלנו, ולכן זה הערוץ היחיד שמגיע לכולם.
      </p>

      {isLoading ? (
        <Spinner />
      ) : (
        <p className="broadcast__count">
          יישלח ל-<strong>{count}</strong> בעלי מוסדות
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
            לשלוח עכשיו ל-<strong>{count}</strong> בעלי מוסדות? אי אפשר לבטל
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
            <Icon name="message" size={15} /> שליחה לכל בעלי המוסדות
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
