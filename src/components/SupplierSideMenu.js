import Icon from "./Icon";
import BrandName from "./BrandName";
import { whatsappUrlWithText } from "../services/whatsapp";
import "../styles/sidemenu.css";

/*
  SupplierSideMenu — תפריט צד לאזור הספק (פורטל ספקים). נפתח מכפתור ☰ ומרכז את
  ההגדרות: פרטי העסק והמוצרים, תשלומים, חשבון וסיסמה, עוגיות, צור קשר, מחיקת
  חשבון (בקשה שדורשת אישור) והתנתקות. בעיצוב תפריט הצד הראשי (sidemenu.css).
*/
// מספר הוואטסאפ/תמיכה של VaddyGo (ציבורי — לא סוד)
const SUPPORT_PHONE = "054-4579179";

function scrollToId(id) {
  const el = typeof document !== "undefined" ? document.getElementById(id) : null;
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function SupplierSideMenu({
  isOpen,
  onClose,
  onChangePassword,
  onDeleteRequest,
  onLogout,
}) {
  if (!isOpen) {
    return null;
  }

  // סוגרים את התפריט ואז גוללים לאזור המבוקש (אחרי שהתפריט נעלם)
  function goTo(id) {
    onClose();
    setTimeout(() => scrollToId(id), 60);
  }

  const contactUrl = whatsappUrlWithText(
    SUPPORT_PHONE,
    "שלום, אשמח לעזרה עם פורטל הספקים של VaddyGo 🙂"
  );

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

        <h3 className="sidemenu__title">הכרטיס שלי</h3>
        <button
          type="button"
          className="sidemenu__action"
          onClick={() => goTo("supplier-card")}
        >
          <Icon name="package" size={18} /> פרטי העסק והמוצרים
        </button>
        <button
          type="button"
          className="sidemenu__action"
          onClick={() => goTo("supplier-card")}
        >
          <Icon name="card" size={18} /> תשלומים
        </button>

        <h3 className="sidemenu__title">החשבון וההגדרות</h3>
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
        <a
          className="sidemenu__action"
          href="/cookies"
          target="_blank"
          rel="noreferrer"
          onClick={onClose}
        >
          <Icon name="settings" size={18} /> הגדרות עוגיות
        </a>
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
