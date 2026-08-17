import { useCallback, useState } from "react";
import Card from "../../components/Card";
import Icon from "../../components/Icon";
import Input from "../../components/Input";
import PasswordField from "../../components/PasswordField";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";
import useApi from "../../hooks/useApi";
import {
  getTwoFactorStatus,
  startTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
  regenerateBackupCodes,
} from "../../services/twoFactorService";
import "../../styles/two-factor.css";

/*
  TwoFactorCard — הפעלה וכיבוי של האימות הדו-שלבי לחשבון שלי.

  למה זה קיים: כל שאר ההגנות במערכת — הצפנה, בידוד נתונים, הרשאות — אינן
  מגינות מפני מי שיודע את הסיסמה. הוא נכנס דרך הדלת הקדמית ורואה הכול
  מפוענח. בחשבון שרואה את כל הגנים, הסיסמה היא נקודת הכשל היחידה שנותרה.

  שני דברים שהמסך הזה חייב לעשות נכון, אחרת התכונה מזיקה:
  • **להציג את קודי הגיבוי בבירור ופעם אחת**, עם אזהרה שאי אפשר לשחזר אותם.
    בלעדיהם, תקלה בתיבת המייל נועלת את בעלת המערכת מחוץ למערכת שלה.
  • **לא להציע SMS כשאין ספק מוגדר** — הבטחה לערוץ שלא יגיע גרועה מלא להציע
    אותו כלל.
*/
const STEP_IDLE = "idle";
const STEP_CODE = "code";

function TwoFactorCard() {
  const { data, isLoading, reload } = useApi(
    useCallback(() => getTwoFactorStatus(), [])
  );

  const [step, setStep] = useState(STEP_IDLE);
  const [channel, setChannel] = useState("email");
  const [phone, setPhone] = useState("");
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  async function handleStartSetup() {
    resetMessages();
    setIsBusy(true);
    try {
      const next = await startTwoFactorSetup({ channel, phone });
      setChallenge(next);
      setStep(STEP_CODE);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleEnable() {
    resetMessages();
    setIsBusy(true);
    try {
      const result = await enableTwoFactor({
        challengeId: challenge.challengeId,
        code: code.trim(),
      });
      setCodes(result.codes);
      setStep(STEP_IDLE);
      setCode("");
      setChallenge(null);
      setSuccess("האימות הדו-שלבי הופעל ✅");
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDisable() {
    resetMessages();
    setIsBusy(true);
    try {
      await disableTwoFactor(password);
      setPassword("");
      setCodes(null);
      setSuccess("האימות הדו-שלבי כובה");
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRegenerate() {
    resetMessages();
    setIsBusy(true);
    try {
      const result = await regenerateBackupCodes(password);
      setPassword("");
      setCodes(result.codes);
      setSuccess("הונפקו קודי גיבוי חדשים. הקודים הקודמים בוטלו.");
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  }

  const enabled = Boolean(data?.enabled);

  return (
    <Card
      title={
        <>
          <Icon name="lock" size={20} /> אימות דו-שלבי
        </>
      }
    >
      <p className="twofa-card__row">
        אחרי הסיסמה תתבקשי גם קוד חד-פעמי. כך, מי שמשיג את הסיסמה שלך עדיין
        לא יכול להיכנס.
      </p>

      {isLoading && <Spinner />}

      {!isLoading && data && (
        <>
          <p className="twofa-card__state">
            <span
              className={`twofa-card__pill twofa-card__pill--${enabled ? "on" : "off"}`}
            >
              {enabled ? "פעיל" : "כבוי"}
            </span>
            {enabled && (
              <span>
                הקוד נשלח ל{data.channel === "sms" ? "טלפון" : "מייל"}
                {data.phone ? ` ${data.phone}` : ""}
              </span>
            )}
          </p>

          {enabled && (
            <p className="twofa-card__row">
              נותרו <strong>{data.backupCodesRemaining}</strong> קודי גיבוי
              {data.trustedDevices > 0
                ? ` · ${data.trustedDevices} מכשירים זכורים`
                : ""}
            </p>
          )}

          {/* ── הפעלה ── */}
          {!enabled && step === STEP_IDLE && (
            <>
              <div className="twofa-card__channels">
                <button
                  type="button"
                  className={`twofa-card__channel${
                    channel === "email" ? " twofa-card__channel--on" : ""
                  }`}
                  onClick={() => setChannel("email")}
                >
                  קוד למייל
                </button>
                <button
                  type="button"
                  className={`twofa-card__channel${
                    channel === "sms" ? " twofa-card__channel--on" : ""
                  }`}
                  onClick={() => setChannel("sms")}
                  disabled={!data.smsAvailable}
                >
                  קוד ב-SMS
                  {!data.smsAvailable ? " (לא זמין כרגע)" : ""}
                </button>
              </div>
              {channel === "sms" && (
                <Input
                  id="twofa-phone"
                  label="מספר הנייד לקבלת הקוד"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              )}
              <div className="twofa-card__actions">
                <Button onClick={handleStartSetup} isLoading={isBusy}>
                  הפעלת האימות
                </Button>
              </div>
            </>
          )}

          {/* ── אימות שהערוץ עובד ── */}
          {step === STEP_CODE && challenge && (
            <>
              <p className="twofa-card__row">
                שלחנו קוד ל־<strong>{challenge.sentTo}</strong>. כדי לוודא
                שהקוד באמת מגיע אלייך, יש להקליד אותו כאן.
              </p>
              <Input
                id="twofa-setup-code"
                label="הקוד שקיבלת"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <div className="twofa-card__actions">
                <Button onClick={handleEnable} isLoading={isBusy}>
                  אישור והפעלה
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep(STEP_IDLE);
                    setChallenge(null);
                    setCode("");
                  }}
                >
                  ביטול
                </Button>
              </div>
            </>
          )}

          {/* ── פעולות כשהאימות כבר פעיל — כולן דורשות סיסמה ── */}
          {enabled && (
            <>
              <PasswordField
                id="twofa-password"
                label="הסיסמה שלך (לאישור הפעולה)"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="twofa-card__actions">
                <Button onClick={handleRegenerate} isLoading={isBusy}>
                  קודי גיבוי חדשים
                </Button>
                <Button variant="secondary" onClick={handleDisable} isLoading={isBusy}>
                  כיבוי האימות
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {error && <p className="settings__error">{error}</p>}
      {success && <p className="settings__success">{success}</p>}

      {/*
        קודי הגיבוי — מוצגים כאן פעם אחת בלבד. אין מסך שמציג אותם שוב, כי
        השרת שומר רק טביעת אצבע שלהם ואינו יכול לשחזר אותם.
      */}
      {codes && (
        <div className="twofa-codes">
          <p className="twofa-codes__warn">
            ⚠️ יש לשמור את הקודים האלה עכשיו — הם מוצגים פעם אחת ולא ניתן
            לראות אותם שוב. כל קוד עובד פעם אחת, והם הדרך להיכנס אם אין גישה
            למייל או לטלפון.
          </p>
          <ul className="twofa-codes__list">
            {codes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="twofa-card__actions">
            <Button
              variant="secondary"
              onClick={() => navigator.clipboard?.writeText(codes.join("\n"))}
            >
              העתקת הקודים
            </Button>
            <Button variant="secondary" onClick={() => setCodes(null)}>
              שמרתי אותם
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default TwoFactorCard;
