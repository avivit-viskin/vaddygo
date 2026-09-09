import { useEffect, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import BrandName from "./BrandName";
import { isStandalone, isIOS, isAndroid } from "../services/pwaInstall";
import "../styles/install-prompt.css";

/*
  InstallAppButton — כפתור קבוע בפוטר: "הורידו את האפליקציה". בלחיצה נפתח הסבר
  איך להוסיף את VaddyGo למסך הבית — באנדרואיד: כפתור השיתוף ← "הוספה למסך הבית";
  באייפון: פתיחה ב-Chrome ← שיתוף ← "הוספה למסך הבית" (בקשת בעלת המוצר).
  מזהה את סוג הטלפון ומדגיש את ההוראה המתאימה, ומציג גם את השנייה. לא מוצג אם
  האפליקציה כבר מותקנת (standalone). אם הדפדפן תומך בהתקנה אמיתית
  (beforeinstallprompt) — מציע גם התקנה בלחיצה אחת.
*/
function InstallAppButton() {
  const [installed, setInstalled] = useState(() => isStandalone());
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setDeferred(event); // שומרים כדי להפעיל התקנה אמיתית בלחיצה
    };
    const onInstalled = () => {
      setInstalled(true);
      setOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // כבר מותקן — אין מה להציע
  if (installed) {
    return null;
  }

  async function nativeInstall() {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      // המשתמש סגר — לא קריטי
    }
    setDeferred(null);
    setOpen(false);
  }

  const ios = isIOS();
  const android = isAndroid();

  return (
    <>
      <button
        type="button"
        className="install-app-btn"
        onClick={() => setOpen(true)}
      >
        📲 הורידו את האפליקציה
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="הורדת האפליקציה למסך הבית"
      >
        <p className="install-intro">
          אפשר להוסיף את <BrandName /> למסך הבית של הטלפון — ואז נכנסים אליה
          בלחיצה אחת, כמו אפליקציה רגילה. בלי חנות ובלי התקנה 💗
        </p>

        {deferred && (
          <div className="install-native">
            <Button onClick={nativeInstall}>התקנה בלחיצה אחת</Button>
            <span className="install-native__or">או לפי סוג הטלפון:</span>
          </div>
        )}

        <div
          className={`install-platform${android ? " install-platform--active" : ""}`}
        >
          <h4>📱 טלפון אנדרואיד</h4>
          <ol className="install-steps">
            <li>
              לחצו על כפתור השיתוף של הדפדפן (סמל השיתוף, או תפריט שלוש הנקודות ⋮
              למעלה).
            </li>
            <li>
              בוחרים <strong>«הוספה למסך הבית»</strong> ומאשרים.
            </li>
          </ol>
        </div>

        <div
          className={`install-platform${ios ? " install-platform--active" : ""}`}
        >
          <h4>🍎 אייפון</h4>
          <ol className="install-steps">
            <li>
              פותחים את הדף בדפדפן <strong>Chrome</strong>.
            </li>
            <li>
              לוחצים על כפתור <strong>השיתוף</strong>.
            </li>
            <li>
              בוחרים <strong>«הוספה למסך הבית»</strong> ומאשרים.
            </li>
          </ol>
        </div>
      </Modal>
    </>
  );
}

export default InstallAppButton;
