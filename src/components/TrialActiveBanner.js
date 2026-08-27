import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import { getActiveInstitution } from "../services/institutionsService";
import "../styles/trial-notice.css";

/*
  TrialActiveBanner — ההתראה שרואה בעל/ת מוסד **בזמן** שהפרו פתוח ללא עלות.

  למה זה נחוץ: עד עכשיו הפרו נפתח בשקט, וההודעה היחידה הגיעה כשהוא **נגמר**.
  מי שלא ידע שהוא מקבל משהו לא ידע גם מה הוא מאבד — והנעילה הפתיעה אותו.
  הבאנר הופך את זה לשקוף משני הכיוונים: מה פתוח, ועד מתי.

  שתי החלטות:

  1. **התאריך מגיע מהשרת ולא מחושב כאן.** אותו שדה שקובע את הנעילה בפועל הוא
     שמוצג — כדי שלא יקרה שהבאנר מבטיח תאריך אחד והמערכת נועלת באחר.

  2. **אפשר לסגור, ונזכר לכל מוסד בנפרד.** זו הודעה חיובית, לא אזהרה; מי
     שקראה אותה לא צריכה לראות אותה בכל כניסה.
*/
const DISMISS_KEY = "vaadygo.trialBannerDismissed";

function readDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

/* המוסד הפעיל נהנה כרגע מפרו ללא עלות (ולא ממנוי בתשלום). */
export function shouldShowTrialActive(institution) {
  return Boolean(institution?.isTrial && institution?.trialEndsAt);
}

/* כמה ימים נותרו, לפי תאריך בלבד (בלי שעות) — "עוד 3 ימים" ולא "עוד 2.4". */
export function daysLeft(trialEndsAt, now = new Date()) {
  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) {
    return null;
  }
  const toDay = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((toDay(end) - toDay(now)) / 86400000);
}

function TrialActiveBanner() {
  /*
    נקרא **פעם אחת בהרכבה** ולא בכל רינדור.

    🔴 באג שדווח מהשטח: "תזוזה של הקטגוריות, מסך רועד". סנכרון המוסדות רץ
    ברקע אחרי שהעמוד כבר צויר, ואז רינדור מחדש היה מכניס את הבאנר **מעל**
    התוכן ודוחף את הקטגוריות למטה — בכל טעינה, אצל כל ועד.

    נתוני המוסד נשמרים ב-localStorage, ולכן מהטעינה השנייה ואילך ההחלטה
    נכונה כבר בציור הראשון והבאנר אינו מזיז דבר.
  */
  const [institution] = useState(() => getActiveInstitution());
  const key = String(institution?.serverGroupId ?? institution?.id ?? "default");
  const [dismissed, setDismissed] = useState(() => readDismissed().has(key));

  if (dismissed || !shouldShowTrialActive(institution)) {
    return null;
  }

  function close() {
    const next = readDismissed();
    next.add(key);
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify([...next]));
    } catch {
      // אין localStorage — הבאנר פשוט יופיע שוב
    }
    setDismissed(true);
  }

  let endText = "";
  try {
    endText = new Date(institution.trialEndsAt).toLocaleDateString("he-IL");
  } catch {
    endText = "";
  }
  const left = daysLeft(institution.trialEndsAt);

  return (
    <div className="trial-banner" role="status">
      <button
        type="button"
        className="trial-banner__close"
        aria-label="סגירת ההודעה"
        onClick={close}
      >
        ✕
      </button>
      <p className="trial-banner__title">
        <Icon name="crown" size={18} /> מסלול הפרו פתוח לך — ללא עלות
      </p>
      <p className="trial-banner__text">
        כל הפיצ'רים המתקדמים זמינים לך עכשיו בחינם
        {endText ? (
          <>
            {" "}
            <strong>עד {endText}</strong>
          </>
        ) : null}
        {typeof left === "number" && left >= 0 && (
          <> ({left === 0 ? "היום האחרון" : `עוד ${left} ימים`})</>
        )}
        . אחרי התאריך הזה אפשר להמשיך במסלול החינמי —{" "}
        <strong>וכל מה שיצרת יישאר במערכת</strong>.
      </p>
      <Link to="/upgrade" className="trial-banner__link">
        מה כלול במסלול הפרו?
      </Link>
    </div>
  );
}

export default TrialActiveBanner;
