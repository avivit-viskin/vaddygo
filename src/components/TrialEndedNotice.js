import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import Button from "./Button";
import { getActiveInstitution } from "../services/institutionsService";
import { PRO_PAYMENT_URL } from "../config/payment";
import "../styles/trial-notice.css";

/*
  TrialEndedNotice — ההודעה שמופיעה בתום חודש הניסיון.

  מודל התמחור (החלטת בעלת המוצר 22.08.2026): בחודש הראשון כל פיצ'רי הפרו
  פתוחים. בסופו **החשבון אינו נחסם** — הוא ממשיך לעבוד במסלול החינמי, ורק
  פיצ'רי הפרו ננעלים.

  שלוש החלטות שמעצבות את הרכיב:

  1. **"מה שיצרת נשמר" נאמר ראשון ובהדגשה.** זה החשש המיידי של מי שרואה
     "תקופת הניסיון הסתיימה", והתשובה עליו קובעת אם היא תישאר או תנטוש.

  2. **"להמשיך בחינם" הוא כפתור אמיתי ולא "אולי אחר כך" קטן.** בעלת המוצר
     ביקשה מסלול חינמי מלא; להסתיר אותו היה הופך את ההודעה לחומה.

  3. **סגירה נזכרת לכל מוסד בנפרד.** מנהלת של שני גנים לא צריכה לקבל את אותה
     הודעה פעמיים אחרי שכבר החליטה על אחד מהם.
*/
const DISMISS_KEY = "vaadygo.trialNoticeDismissed";

function readDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function writeDismissed(set) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify([...set]));
  } catch {
    // אין localStorage — ההודעה פשוט תופיע שוב בפעם הבאה
  }
}

/* המוסד הפעיל סיים ניסיון ואינו מנוי בתשלום. */
export function shouldShowTrialEnded(institution) {
  if (!institution) {
    return false;
  }
  // מנוי בתשלום — אין מה להציע
  if (institution.isPro && !institution.isTrial) {
    return false;
  }
  // עדיין בתוך הניסיון — הפיצ'רים פתוחים, אין מה להודיע
  if (institution.isTrial) {
    return false;
  }
  if (!institution.trialEndsAt) {
    return false;
  }
  const ended = new Date(institution.trialEndsAt).getTime();
  return Number.isFinite(ended) && ended < Date.now();
}

function TrialEndedNotice() {
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

  if (dismissed || !shouldShowTrialEnded(institution)) {
    return null;
  }

  /* "להמשיך בחינם" = לסגור את ההודעה. אין מה לשנות בשרת — המסלול כבר חינמי. */
  function continueFree() {
    const next = readDismissed();
    next.add(key);
    writeDismissed(next);
    setDismissed(true);
  }

  return (
    <div className="trial-notice" role="status">
      <p className="trial-notice__title">
        <Icon name="crown" size={18} /> תקופת הניסיון של הפרו הסתיימה
      </p>

      {/*
        "המעבר לא מוחק" ולא "שום דבר לא נמחק": ב-30.8 מתבצעת מחיקה שנתית של
        נתוני השנה — לכולם, גם למנויים בתשלום. ניסוח מוחלט היה נקרא כהבטחה
        שהמערכת מפרה כמה חודשים אחר כך.
      */}
      <p className="trial-notice__saved">
        <strong>כל מה שיצרת נשמר</strong> — התלמידים, הגבייה, ההוצאות והסקרים.
        המעבר למסלול החינמי לא מוחק כלום.
      </p>

      <p className="trial-notice__text">
        מכאן אפשר להמשיך <strong>במסלול החינמי</strong> ולהשתמש בכל הניהול
        השוטף. פיצ'רי הפרו (כמו סקרים, עוזרת ה-AI וניהול הרשאות) ננעלים — ומה
        שכבר יצרת בהם נשאר לצפייה.
      </p>

      <div className="trial-notice__actions">
        {PRO_PAYMENT_URL && (
          <a
            href={PRO_PAYMENT_URL}
            target="_blank"
            rel="noreferrer"
            className="trial-notice__link"
          >
            <Button>
              <Icon name="card" size={15} /> חידוש הפרו — ₪149 לשנה
            </Button>
          </a>
        )}
        <Button variant="secondary" onClick={continueFree}>
          להמשיך במסלול החינמי
        </Button>
        <Link to="/upgrade" className="trial-notice__compare">
          מה ההבדל בין המסלולים?
        </Link>
      </div>
    </div>
  );
}

export default TrialEndedNotice;
