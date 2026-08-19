import { useEffect, useState } from "react";
import BrandName from "./BrandName";
import "../styles/install-prompt.css";

/*
  AddToHomeScreen — באנר עדין שמזמין להוסיף את VaddyGo למסך הבית ("אפליקציה"
  בלי חנות). מופיע פעם אחת בלבד, ניתן לסגירה, ולא חוזר אחרי סגירה/התקנה.
  • אנדרואיד/כרום: תופס את אירוע ה-beforeinstallprompt ומציג כפתור "התקנה"
    שמפעיל את ההתקנה האמיתית של הדפדפן.
  • אייפון (Safari): אין התקנה תוכנתית — מציגים רמז ידני (שיתוף → הוספה למסך הבית).
  לא מוצג אם האתר כבר רץ כאפליקציה מותקנת (standalone).
*/
const DISMISS_KEY = "vaadygo.a2hsDismissed";

function isStandalone() {
  // matchMedia לא קיים בכל סביבה (למשל jsdom בטסטים) — מגינים
  const standaloneDisplay =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  return Boolean(standaloneDisplay || window.navigator.standalone);
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

// ספארי "אמיתי" באייפון — רק בו יש "הוספה למסך הבית". בדפדפן-בתוך-אפליקציה
// (וואטסאפ/פייסבוק/אינסטגרם) או בכרום/פיירפוקס לאייפון אין את האפשרות, ולכן
// צריך קודם לפתוח בספארי. מזהים לפי היעדר "Safari" או נוכחות טוקן של אפליקציה/דפדפן אחר.
function isIOSSafari() {
  const ua = window.navigator.userAgent || "";
  return (
    isIOS() &&
    /Safari/i.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|FBAN|FBAV|Instagram|Line|MicroMessenger|Twitter|Snapchat|Pinterest/i.test(
      ua
    )
  );
}

// כרום "אמיתי" (לא Edge/Opera/Samsung/פיירפוקס, ולא דפדפן-בתוך-אפליקציה כמו
// וואטסאפ/פייסבוק/אינסטגרם — שמזוהים ב-"wv" או בטוקן של האפליקציה). רק בכרום
// ההוספה למסך הבית עובדת חלק באנדרואיד; אחרת צריך קודם לפתוח בכרום.
function isChrome() {
  const ua = window.navigator.userAgent || "";
  return (
    /Chrome/i.test(ua) &&
    !/wv|Edg|EdgA|OPR|OPT|SamsungBrowser|CriOS|FxiOS|Firefox|FBAN|FBAV|Instagram|Line|MicroMessenger|Twitter|Snapchat|Pinterest|GSA/i.test(
      ua
    )
  );
}

function AddToHomeScreen() {
  const [show, setShow] = useState(false);
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    if (isStandalone()) {
      return undefined; // כבר מותקן — לא מציעים
    }
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if (dismissed) {
      return undefined;
    }

    // אנדרואיד/כרום: הדפדפן מודיע שאפשר להתקין — תופסים ומציגים כפתור התקנה
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setDeferred(event);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // אחרי התקנה מוצלחת — לא להציע שוב
    const onInstalled = () => {
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        // ignore
      }
      setShow(false);
    };
    window.addEventListener("appinstalled", onInstalled);

    // מציגים את הבאנר אחרי השהיה קצרה בכל מקרה: אם ה-beforeinstallprompt נתפס
    // (כרום עם התקנה אמיתית) — יופיע כפתור "התקנה"; אם לא (אין service worker,
    // או אייפון) — יופיע רמז ידני איך להוסיף מתפריט הדפדפן / כפתור השיתוף. כך
    // גם משתמשי אנדרואיד/כרום מקבלים הכוונה, ולא רק אייפון.
    const timer = setTimeout(() => setShow(true), 4500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  }

  async function install() {
    if (!deferred) {
      return;
    }
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      // המשתמש סגר — לא קריטי
    }
    dismiss(); // בין אם התקין ובין אם לא — לא מציקים שוב
  }

  if (!show) {
    return null;
  }

  return (
    <div className="a2hs" role="dialog" aria-label="הוספה למסך הבית">
      <button
        type="button"
        className="a2hs__close"
        aria-label="סגירה"
        onClick={dismiss}
      >
        ✕
      </button>
      <div className="a2hs__body">
        <span className="a2hs__icon" aria-hidden="true">
          🩷
        </span>
        <div className="a2hs__text">
          <strong>
            הוסיפו את <BrandName /> למסך הבית
          </strong>
          {deferred ? (
            <span>גישה מהירה כמו אפליקציה — בלי להתקין מהחנות.</span>
          ) : isIOS() ? (
            isIOSSafari() ? (
              <span>לחצו על שיתוף (למטה) ואז «הוספה למסך הבית».</span>
            ) : (
              <span>
                קודם פתחו את הדף ב-Chrome, ואז לחצו על שיתוף ובחרו «הוספה למסך
                הבית».
              </span>
            )
          ) : isChrome() ? (
            <span>בתפריט הדפדפן (⋮) בחרו «הוספה למסך הבית».</span>
          ) : (
            <span>
              כדי להוסיף למסך הבית, קודם פתחו את הדף ב-<strong>Chrome</strong>:
              בתפריט (⋮) בחרו «פתיחה ב-Chrome», ואז ב-Chrome פתחו את התפריט (⋮)
              ובחרו «הוספה למסך הבית».
            </span>
          )}
        </div>
      </div>
      {deferred && (
        <button type="button" className="a2hs__install" onClick={install}>
          התקנה
        </button>
      )}
    </div>
  );
}

export default AddToHomeScreen;
