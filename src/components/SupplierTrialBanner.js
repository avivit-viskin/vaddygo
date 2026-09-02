import { useState } from "react";
import Icon from "./Icon";
import "../styles/trial-notice.css";

/*
  SupplierTrialBanner — ההתראה שרואה ספק **בזמן** שהפרו פתוח לו ללא עלות.

  מקבילה ל-TrialActiveBanner של הוועד, ומאותה סיבה: עד עכשיו הפרו נפתח בשקט,
  והספק היה מגלה שקיבל משהו רק כשהוא נסגר. מי שלא ידע שהוא מקבל לא ידע גם מה
  הוא מאבד.

  שלוש החלטות:

  1. **הנתונים מגיעים מהשרת ולא מחושבים כאן.** אותו כלל שקובע את הנעילה בפועל
     (VendorProPolicy) הוא שמייצר את isTrial ואת trialEndsAt — כדי שלא יקרה
     שהבאנר מבטיח תאריך אחד והמערכת נועלת באחר.

  2. **מוצג רק למי שלא שילם.** ספק שרכש פרו מקבל את מה שהוא שילם עליו; להגיד
     לו "זה בחינם" זה להעליב אותו ולבלבל.

  3. **אפשר לסגור, ונזכר לספק הזה.** זו הודעה חיובית ולא אזהרה; מי שקרא אותה
     לא צריך לראות אותה בכל כניסה.
*/
const DISMISS_KEY = "vaadygo.supplierTrialDismissed";

function readDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

/* הספק נהנה כרגע מפרו ללא עלות (ולא ממנוי בתשלום). */
export function shouldShowSupplierTrial(vendor) {
  return Boolean(vendor?.isTrial && vendor?.trialEndsAt);
}

/* כמה ימים נותרו, לפי תאריך בלבד — "עוד 3 ימים" ולא "עוד 2.4". */
export function daysLeft(trialEndsAt, now = new Date()) {
  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) {
    return null;
  }
  const toDay = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((toDay(end) - toDay(now)) / 86400000);
}

function SupplierTrialBanner({ vendor }) {
  /*
    ההחלטה נקבעת פעם אחת בהרכבה. העמוד מציג ספינר עד שכרטיס הספק נטען ורק
    אז מצייר, ולכן הבאנר נמצא שם כבר בציור הראשון ואינו דוחף תוכן למטה —
    התקלה שדווחה מהשטח אצל הוועדים ("תזוזה של הקטגוריות, מסך רועד").
  */
  const key = String(vendor?.id ?? "default");
  const [dismissed, setDismissed] = useState(() => readDismissed().has(key));

  if (dismissed || !shouldShowSupplierTrial(vendor)) {
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
    endText = new Date(vendor.trialEndsAt).toLocaleDateString("he-IL");
  } catch {
    endText = "";
  }
  const left = daysLeft(vendor.trialEndsAt);

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
        כל פיצ'רי הפרו זמינים לך עכשיו בחינם
        {endText ? (
          <>
            {" "}
            <strong>עד {endText}</strong>
          </>
        ) : null}
        {typeof left === "number" && left >= 0 && (
          <> ({left === 0 ? "היום האחרון" : `עוד ${left} ימים`})</>
        )}
        : <strong>הפניות שוועדים שולחים אליך</strong>, מבצע מיוחד בכרטיס,
        ודוח הצפיות והפניות. אחרי התאריך הזה הכרטיס שלך נשאר במקומו —{" "}
        <strong>רק הפיצ'רים האלה ננעלים</strong>.
      </p>
    </div>
  );
}

export default SupplierTrialBanner;
