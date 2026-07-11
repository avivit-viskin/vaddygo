import { useNavigate } from "react-router-dom";
import BrandName from "./BrandName";
import InstitutionSwitcher from "./InstitutionSwitcher";
import { logout } from "../services/authService";
import { whatsappUrl } from "../services/whatsapp";
import "../styles/sidemenu.css";

/*
  SideMenu — תפריט צד נשלף (UI_SPEC ס' 3.5): מחליף המוסדות, צור קשר והתנתקות.
  נפתח מכפתור ☰ שבכותרת, נשלף מצד ימין מתחת לכותרת (לא מכסה את הלוגו).
*/
// מספר הוואטסאפ של התמיכה (מספר ציבורי — לא סוד)
const SUPPORT_PHONE = "054-4579179";
const SUPPORT_URL = `${whatsappUrl(SUPPORT_PHONE)}?text=${encodeURIComponent(
  "שלום, אשמח לעזרה עם VaddyGo 🙂"
)}`;

function SideMenu({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) {
    return null;
  }

  function go(path) {
    onClose();
    navigate(path);
  }

  function handleLogout() {
    logout();
    window.location.href = "/login";
  }

  return (
    <div className="sidemenu-overlay" onClick={onClose}>
      <aside
        className="sidemenu"
        aria-label="תפריט צד"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sidemenu__header">
          <BrandName withHeart />
          <button
            type="button"
            className="sidemenu__close"
            aria-label="סגירה"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <h3 className="sidemenu__title">המוסדות שלי</h3>
        <InstitutionSwitcher onClose={onClose} />

        <h3 className="sidemenu__title">הגדרות</h3>
        <button
          type="button"
          className="sidemenu__action"
          onClick={() => go("/collection-settings")}
        >
          💰 עריכת גבייה
        </button>

        <div className="sidemenu__footer">
          <a
            className="sidemenu__action"
            href={SUPPORT_URL}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
          >
            💬 צור קשר
          </a>
          <button type="button" className="sidemenu__logout" onClick={handleLogout}>
            🚪 התנתק
          </button>
        </div>
      </aside>
    </div>
  );
}

export default SideMenu;
