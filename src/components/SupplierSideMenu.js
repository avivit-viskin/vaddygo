import Icon from "./Icon";
import BrandName from "./BrandName";
import ProBadge from "./ProBadge";
import { whatsappUrlWithText } from "../services/whatsapp";
import { toastSuccess } from "../services/toastBus";
import "../styles/sidemenu.css";

/*
  SupplierSideMenu — תפריט צד לאזור הספק: חשבון והגדרות בלבד (הניווט בין הדפים
  נעשה בטאבים למעלה). כולל: שם העסק, חשבון וסיסמה, הגדרות עוגיות, מחיקת חשבון,
  צור קשר והתנתקות. בעיצוב תפריט הצד הראשי.
*/
// מספר הוואטסאפ/תמיכה של VaddyGo (ציבורי — לא סוד)
const SUPPORT_PHONE = "054-4579179";

function SupplierSideMenu({
  isOpen,
  isPro,
  onClose,
  onUpgrade,
  onSettings,
  onChangeName,
  onChangePassword,
  onCookies,
  onDeleteRequest,
  onLogout,
}) {
  if (!isOpen) {
    return null;
  }

  const contactUrl = whatsappUrlWithText(
    SUPPORT_PHONE,
    "שלום, אשמח לעזרה עם פורטל הספקים של VaddyGo 🙂"
  );

  // שיתוף הקישור לפורטל הספקים (הזמנת ספקים חדשים). באפליקציה עצמאית אין שורת
  // כתובת, ולכן פותחים את תפריט השיתוף של המכשיר (navigator.share); אם לא נתמך —
  // מעתיקים את הקישור ללוח. משתפים את /suppliers בלבד (ציבורי) — לא את קישור
  // העריכה האישי שהוא סוד.
  async function sharePortal() {
    const url = `${window.location.origin}/suppliers`;
    const shareData = {
      title: "פורטל הספקים של VaddyGo",
      text: "מוזמנים להצטרף כספקים ל-VaddyGo — לנהל קטלוג מוצרים שוועדי הורים רואים ומזמינים ממנו:",
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        onClose();
        return;
      } catch {
        /* המשתמשת ביטלה את השיתוף — לא עושים כלום */
        return;
      }
    }
    // אין שיתוף מובנה (בעיקר במחשב) — מעתיקים את הקישור
    try {
      await navigator.clipboard.writeText(url);
      toastSuccess("הקישור לפורטל הספקים הועתק — אפשר להדביק ולשלוח 🙂");
    } catch {
      toastSuccess(url);
    }
    onClose();
  }

  return (
    <div className="sidemenu-overlay" onClick={onClose}>
      <aside
        className="sidemenu"
        aria-label="תפריט ספק"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sidemenu__header">
          <BrandName />
          <button
            type="button"
            className="sidemenu__close"
            aria-label="סגירה"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <button
          type="button"
          className="sidemenu__action sidemenu__upgrade"
          onClick={() => {
            onClose();
            onUpgrade();
          }}
        >
          שדרוגי פרו{" "}
          <ProBadge title="כל כלי הפרו של הספק במקום אחד" isPro={isPro} />
        </button>

        <h3 className="sidemenu__title">שיתוף</h3>
        <button
          type="button"
          className="sidemenu__action"
          onClick={sharePortal}
        >
          <Icon name="link" size={18} /> שיתוף פורטל הספקים
        </button>

        <h3 className="sidemenu__title">החשבון וההגדרות</h3>
        <button
          type="button"
          className="sidemenu__action"
          onClick={() => {
            onClose();
            onSettings();
          }}
        >
          <Icon name="settings" size={18} /> הגדרות משתמש
        </button>
        <button
          type="button"
          className="sidemenu__action"
          onClick={() => {
            onClose();
            onChangeName();
          }}
        >
          <Icon name="pencil" size={18} /> שם העסק
        </button>
        <button
          type="button"
          className="sidemenu__action"
          onClick={() => {
            onClose();
            onChangePassword();
          }}
        >
          <Icon name="key" size={18} /> חשבון וסיסמה
        </button>
        <button
          type="button"
          className="sidemenu__action"
          onClick={() => {
            onClose();
            onCookies();
          }}
        >
          <Icon name="settings" size={18} /> הגדרות עוגיות
        </button>
        <button
          type="button"
          className="sidemenu__action"
          onClick={() => {
            onClose();
            onDeleteRequest();
          }}
        >
          <Icon name="trash" size={18} /> מחיקת החשבון
        </button>

        <div className="sidemenu__footer">
          <a
            className="sidemenu__action sidemenu__contact"
            href={contactUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
          >
            <Icon name="phone" size={18} /> צור קשר
          </a>
          <button type="button" className="sidemenu__logout" onClick={onLogout}>
            <Icon name="logout" size={18} /> התנתק
          </button>
        </div>
      </aside>
    </div>
  );
}

export default SupplierSideMenu;
