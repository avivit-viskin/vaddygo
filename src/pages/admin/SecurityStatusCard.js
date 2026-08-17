import { useCallback } from "react";
import useApi from "../../hooks/useApi";
import Icon from "../../components/Icon";
import Spinner from "../../components/Spinner";
import ErrorMessage from "../../components/ErrorMessage";
import { getSecurityStatus } from "../../services/securityStatusService";
import "../../styles/security-status.css";

/*
  SecurityStatusCard — "האם ההגנות שהגדרתי באמת פועלות?".

  כל ההגנות האלה מופעלות דרך משתני סביבה ב-Railway, והמערכת עובדת בדיוק אותו
  דבר כשהן כבויות — הצפנה, למשל, אינה נראית בשום מסך. בלי החיווי הזה אין דרך
  לדעת אם הגדרה נקלטה, וקל לחשוב שמשהו מוגן כשהוא לא.

  מוצג רק למנהלת (העמוד כולו חסום), ומציג דגלים בלבד — לעולם לא מפתחות.
*/
const CHECKS = [
  {
    key: "encryptionAtRest",
    label: "הצפנת שדות רגישים",
    onText: "אלרגיות, כתובת וטלפוני הורים נשמרים מוצפנים",
    offText: "השדות נשמרים כטקסט. להפעלה: משתנה Encryption__Key ב-Railway",
  },
  {
    key: "strongJwtKey",
    label: "מפתח הזדהות חזק",
    onText: "מוגדר מפתח ייעודי לייצור",
    offText: "משתמש במפתח הפיתוח — יש להגדיר Jwt__Key",
  },
  {
    key: "productionCors",
    label: "גישה מוגבלת לדומיין שלך",
    onText: "רק הכתובת של VaddyGo רשאית לפנות לשרת",
    offText: "מוגדר localhost בלבד — הפרונט בייצור ייחסם",
  },
  {
    key: "backupsEnabled",
    label: "גיבוי אוטומטי",
    onText: "רץ בכל עלייה ואחת ל-24 שעות",
    offText: "כבוי — אין גיבוי אוטומטי של המסד",
  },
  {
    key: "realPaymentProvider",
    label: "סליקת אשראי",
    onText: "מחוברת סליקה אמיתית",
    offText: "סימולטור בלבד — לא נגבה כסף אמיתי",
    // סליקה כבויה היא החלטה עסקית ולא ליקוי — לכן לא מסומנת באדום
    optional: true,
  },
];

function SecurityStatusCard() {
  const { data, isLoading, error } = useApi(
    useCallback(() => getSecurityStatus(), [])
  );

  let backupText = "";
  if (data?.lastBackupAt) {
    try {
      backupText = new Date(data.lastBackupAt).toLocaleString("he-IL");
    } catch {
      backupText = "";
    }
  }

  return (
    <section className="secstat">
      <h3 className="secstat__title">
        <Icon name="lock" size={18} /> מצב ההגנות
      </h3>
      <p className="secstat__hint">
        ההגנות מופעלות דרך Railway, והמערכת נראית זהה גם כשהן כבויות — כאן
        רואים מה באמת פעיל כרגע.
      </p>

      {isLoading && <Spinner />}
      {!isLoading && error && <ErrorMessage message={error} />}

      {!isLoading && !error && data && (
        <ul className="secstat__list">
          {CHECKS.map((check) => {
            const on = Boolean(data[check.key]);
            const tone = on ? "on" : check.optional ? "off" : "bad";
            return (
              <li key={check.key} className={`secstat__row secstat__row--${tone}`}>
                <span className="secstat__icon" aria-hidden="true">
                  <Icon name={on ? "check" : "warning"} size={16} />
                </span>
                <span className="secstat__body">
                  <span className="secstat__label">{check.label}</span>
                  <span className="secstat__desc">
                    {on ? check.onText : check.offText}
                  </span>
                </span>
                <span className="secstat__pill">{on ? "פעיל" : "כבוי"}</span>
              </li>
            );
          })}
          {backupText && (
            <li className="secstat__last">גיבוי אחרון: {backupText}</li>
          )}
        </ul>
      )}
    </section>
  );
}

export default SecurityStatusCard;
