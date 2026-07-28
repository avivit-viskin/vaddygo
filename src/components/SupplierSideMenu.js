import Icon from "./Icon";
import BrandName from "./BrandName";
import { whatsappUrlWithText } from "../services/whatsapp";
import "../styles/sidemenu.css";

/*
  SupplierSideMenu — תפריט צד לאזור הספק (פורטל ספקים). נפתח מכפתור ☰ ומנווט
  בין דפי אזור הספק (בית / מוצרים / תשלומים / רשתות / תצוגה), ומרכז את ההגדרות:
  חשבון וסיסמה, עוגיות, מחיקת חשבון, צור קשר והתנתקות. בעיצוב תפריט הצד הראשי.
*/
// מספר הוואטסאפ/תמיכה של VaddyGo (ציבורי — לא סוד)
const SUPPORT_PHONE = "054-4579179";

const NAV = [
  { key: "home", label: "בית", icon: "home" },
  { key: "products", label: "המוצרים שלי", icon: "package" },
  { key: "payments", label: "תשלומים", icon: "card" },
  { key: "socials", label: "רשתות חברתיות", icon: "link" },
  { key: "preview", label: "כך הוועד רואה", icon: "eye" },
];

function SupplierSideMenu({
  isOpen,
  onClose,
  onNavigate,
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
        {NAV.map((item) => (
          <button
            key={item.key}
            type="button"
            className="sidemenu__action"
            onClick={() => {
              onClose();
              onNavigate(item.key);
            }}
          >
            <Icon name={item.icon} size={18} /> {item.label}
          </button>
        ))}

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
