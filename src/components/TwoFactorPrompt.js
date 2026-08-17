import { useState } from "react";
import Button from "./Button";
import Input from "./Input";
import ErrorMessage from "./ErrorMessage";
import Icon from "./Icon";
import { verifyTwoFactor, resendTwoFactorCode } from "../services/authService";
import "../styles/two-factor.css";

/*
  TwoFactorPrompt — מסך הקוד החד-פעמי, השלב השני בכניסה.

  שלוש החלטות ממשק שנועדו למנוע את הכישלון האמיתי של התכונה — משתמשת שנתקעת
  בחוץ ומאבדת אמון במערכת שלה:

  1. **"שלחו לי בדרך אחרת"** מוצג כאן ולא במסך נסתר. מי שאין לה גישה לתיבת
     המייל באותו רגע לא צריכה להתחיל את ההתחברות מחדש (בקשת בעלת המוצר).
  2. **קוד גיבוי מוקלד באותו שדה.** ברגע לחוץ אין מקום לחפש מסך אחר; הקוד
     מזוהה לפי הצורה שלו.
  3. **"זכור את המכשיר הזה" מסומן כברירת מחדל.** תכונת אבטחה שמעצבנת בכל
     כניסה נכבית, ואז ההגנה שווה אפס.

  הרכיב אינו יודע לאן ממשיכים אחרי הצלחה — הדף שקרא לו מחליט (onSuccess).
*/
function TwoFactorPrompt({ challenge, onSuccess, onCancel }) {
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState("");
  // מתעדכן בשליחה חוזרת: מזהה אתגר חדש וערוץ חדש
  const [active, setActive] = useState(challenge);

  const others = (active.channels || []).filter((c) => c.key !== active.channel);

  async function handleSubmit(e) {
    e.preventDefault();
    const entered = code.trim();
    if (!entered) {
      setError("צריך למלא את הקוד");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const auth = await verifyTwoFactor({
        challengeId: active.challengeId,
        code: entered,
        rememberDevice,
      });
      await onSuccess(auth);
    } catch (err) {
      setError(err.message);
      setCode("");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* שליחה חוזרת — לאותו ערוץ או לאחר. מחזירה אתגר חדש שמחליף את הקודם. */
  async function handleResend(channelKey) {
    setError("");
    setNotice("");
    setIsSending(true);
    try {
      const next = await resendTwoFactorCode({
        challengeId: active.challengeId,
        channel: channelKey,
      });
      setActive(next);
      setCode("");
      setNotice(`נשלח קוד חדש ל-${next.sentTo}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="twofa">
      <h2 className="twofa__title">
        <Icon name="lock" size={18} /> עוד שלב אחד
      </h2>
      <p className="twofa__lead">
        שלחנו קוד בן 6 ספרות ל־<strong>{active.sentTo}</strong>
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <Input
          id="twofa-code"
          label="הקוד שקיבלת"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <label className="twofa__remember">
          <input
            type="checkbox"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
          />
          <span>לזכור את המכשיר הזה ל-30 יום</span>
        </label>

        {notice && <p className="twofa__notice">{notice}</p>}
        {error && <ErrorMessage message={error} />}

        <div className="auth-page__actions">
          <Button type="submit" isLoading={isSubmitting}>
            כניסה
          </Button>
        </div>
      </form>

      <div className="twofa__alt">
        <button
          type="button"
          className="twofa__link"
          onClick={() => handleResend(active.channel)}
          disabled={isSending}
        >
          לא הגיע? שליחה חוזרת
        </button>
        {others.map((c) => (
          <button
            key={c.key}
            type="button"
            className="twofa__link"
            onClick={() => handleResend(c.key)}
            disabled={isSending}
          >
            שלחו לי ב{c.label} ({c.target})
          </button>
        ))}
      </div>

      <p className="twofa__hint">
        אין לך גישה למייל או לטלפון? אפשר להקליד <strong>קוד גיבוי</strong> באותו
        שדה — אחד מהקודים ששמרת כשהפעלת את האימות.
      </p>

      <button type="button" className="twofa__link twofa__back" onClick={onCancel}>
        חזרה למסך הכניסה
      </button>
    </div>
  );
}

export default TwoFactorPrompt;
