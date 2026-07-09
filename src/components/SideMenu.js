import BrandName from "./BrandName";
import InstitutionSwitcher from "./InstitutionSwitcher";
import { logout } from "../services/authService";
import "../styles/sidemenu.css";

/*
  SideMenu — תפריט צד נשלף (UI_SPEC ס' 3.5): מכיל את מחליף המוסדות ויציאה.
  קטגוריות נוספות יתווספו כאן בהמשך. נפתח מכפתור ☰ שבכותרת.
*/
function SideMenu({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  function handleLogout() {
    logout();
    window.location.href = "/welcome";
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

        <div className="sidemenu__footer">
          <button type="button" className="sidemenu__logout" onClick={handleLogout}>
            יציאה
          </button>
        </div>
      </aside>
    </div>
  );
}

export default SideMenu;
