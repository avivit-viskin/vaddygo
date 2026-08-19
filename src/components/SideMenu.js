import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandName from "./BrandName";
import Icon from "./Icon";
import InstitutionSwitcher from "./InstitutionSwitcher";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { logout, isSuperAdmin } from "../services/authService";
import { addInstitution } from "../services/institutionsService";
import { whatsappUrl } from "../services/whatsapp";
import { startTour } from "../services/tourBus";
import ProBadge from "./ProBadge";
import { isFeatureLocked } from "../services/plan";
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");

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

  function handleAddInstitution(event) {
    event.preventDefault();
    if (!newName.trim()) {
      setAddError("צריך למלא שם למוסד");
      return;
    }
    // יוצר מוסד חדש (לא-מופעל) וממשיך למסך ההפעלה שלו
    const id = addInstitution(newName);
    setIsAddOpen(false);
    setNewName("");
    onClose();
    navigate(`/institutions/${id}/purchase`);
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
        <button
          type="button"
          className="sidemenu__action"
          onClick={() => {
            // הוספת מוסד נוסף = פיצ'ר פרו (החלטת בעלת המוצר, 10.08.2026).
            // מעבר בין מוסדות קיימים נשאר חינם — רק ההוספה חסומה, ומי שאינה
            // מנויה מגיעה לעמוד השדרוג במקום לטופס.
            if (isFeatureLocked("multiInstitution")) {
              go("/upgrade");
              return;
            }
            setAddError("");
            setNewName("");
            setIsAddOpen(true);
          }}
        >
          <Icon name="plus" size={18} /> הוסף מוסד{" "}
          <ProBadge title="הוספת מוסד נוסף — פיצ'ר פרו" />
        </button>

        <button
          type="button"
          className="sidemenu__action sidemenu__upgrade"
          data-tour="menu-pro"
          onClick={() => go("/upgrade")}
        >
          שדרוגי פרו{" "}
          <ProBadge title="כל כלי הפרו במקום אחד" />
        </button>

        <h3 className="sidemenu__title">הגדרות</h3>
        <button
          type="button"
          className="sidemenu__action"
          data-tour="menu-collection"
          onClick={() => go("/collection-settings")}
        >
          <Icon name="wallet" size={18} /> עריכת גבייה
        </button>
        <button
          type="button"
          className="sidemenu__action"
          data-tour="menu-settings"
          onClick={() => go("/settings")}
        >
          <Icon name="bell" size={18} /> הגדרות התראות
        </button>

        {/* אזור המנהלת — מוצג רק ל-SuperAdmin (בעלת VaddyGo), לא לוועדים */}
        {isSuperAdmin() && (
          <>
            <h3 className="sidemenu__title">ניהול VaddyGo</h3>
            <button
              type="button"
              className="sidemenu__action"
              onClick={() => go("/admin/usage")}
            >
              <Icon name="chart" size={18} /> נתוני שימוש
            </button>
          </>
        )}

        <div className="sidemenu__footer">
          <button
            type="button"
            className="sidemenu__action"
            onClick={() => {
              // סוגרים את התפריט ואז מפעילים את הסיור — כדי שהחלוניות יופיעו
              // מעל המסך ולא מתחת לתפריט הפתוח
              onClose();
              startTour();
            }}
          >
            <span aria-hidden="true">🧭</span> סיור באפליקציה
          </button>
          <a
            className="sidemenu__action sidemenu__contact"
            href={SUPPORT_URL}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
          >
            <Icon name="phone" size={18} /> צור קשר
          </a>
          <button type="button" className="sidemenu__logout" onClick={handleLogout}>
            <Icon name="logout" size={18} /> התנתק
          </button>
        </div>
      </aside>

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="הוספת מוסד חדש"
      >
        <form onSubmit={handleAddInstitution}>
          <Input
            id="new-institution-name"
            label="שם המוסד"
            placeholder="למשל: גן הרימון"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setAddError("");
            }}
            error={addError}
          />
          <p className="purchase__note">
            המוסד יתווסף לרשימה, ואפשר להפעיל אותו בלחיצה עליו.
          </p>
          <div style={{ marginTop: 12 }}>
            <Button type="submit">המשך</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SideMenu;
