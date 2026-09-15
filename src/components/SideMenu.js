import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon";
import InstitutionSwitcher from "./InstitutionSwitcher";
import Modal from "./Modal";
import ShareLinkModal from "./ShareLinkModal";
import Input from "./Input";
import Button from "./Button";
import { logout, isSuperAdmin, getUser } from "../services/authService";
import {
  addInstitution,
  getActiveInstitution,
} from "../services/institutionsService";
import { whatsappUrl } from "../services/whatsapp";
import { startTour } from "../services/tourBus";
import ProBadge from "./ProBadge";
import { isFeatureLocked, isPro } from "../services/plan";
import "../styles/sidemenu.css";

/*
  SideMenu — תפריט צד נשלף (UI_SPEC ס' 3.5). עיצוב בסגנון "פרופיל" (בהשראת
  PayBox, בקשת בעלת המוצר): כותרת עם עיגול ראשי-תיבות, שם המוסד הפעיל והמסלול,
  ואז קבוצות פעולות מעוצבות ככרטיסים רכים עם אייקון בכל שורה. נפתח מכפתור ☰.
*/
// מספר הוואטסאפ של התמיכה (מספר ציבורי — לא סוד)
const SUPPORT_PHONE = "054-4579179";
const SUPPORT_URL = `${whatsappUrl(SUPPORT_PHONE)}?text=${encodeURIComponent(
  "שלום, אשמח לעזרה עם VaddyGo 🙂"
)}`;

// ראשי-תיבות לעיגול הפרופיל: שתי המילים הראשונות (למשל "גן כוכב" → "גכ")
function initials(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

/*
  MenuRow — שורת פעולה בכרטיס: אייקון בהתחלה, תווית (ואולי תג פרו), וחץ בסוף.
  href → קישור חיצוני (נפתח בטאב חדש); אחרת כפתור. tone צובע שורה מיוחדת.
*/
function MenuRow({ icon, label, badge, dataTour, onClick, href, tone }) {
  const cls = `sidemenu__row${tone ? ` sidemenu__row--${tone}` : ""}`;
  const inner = (
    <>
      <span className="sidemenu__row-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="sidemenu__row-label">
        {label}
        {badge}
      </span>
      <span className="sidemenu__row-chevron" aria-hidden="true">
        ‹
      </span>
    </>
  );
  if (href) {
    return (
      <a
        className={cls}
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={onClick}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      data-tour={dataTour || undefined}
      onClick={onClick}
    >
      {inner}
    </button>
  );
}

function SideMenu({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");
  // שיתוף קישור ההרשמה — הדרך היחידה לשתף כשהאפליקציה מותקנת במסך הבית (אז
  // הדפדפן מסתיר את שורת הכתובת וכפתור השיתוף שלו). דווח מהשטח.
  const [isShareOpen, setIsShareOpen] = useState(false);

  // נעילת גלילת הרקע כשהתפריט פתוח — כדי שהמסך מאחור לא יזוז/יגלול. משוחזר
  // בסגירה. חייב לרוץ לפני ה-return המוקדם (כללי ה-hooks).
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

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

  // הוספת מוסד נוסף = פיצ'ר פרו (החלטת בעלת המוצר, 10.08.2026). מעבר בין
  // מוסדות קיימים חינם — רק ההוספה חסומה, ומי שאינה מנויה מגיעה לעמוד השדרוג.
  function openAddInstitution() {
    if (isFeatureLocked("multiInstitution")) {
      go("/upgrade");
      return;
    }
    setAddError("");
    setNewName("");
    setIsAddOpen(true);
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

  const displayName =
    getActiveInstitution()?.name || getUser()?.username || "VaddyGo";

  return (
    <div className="sidemenu-overlay" onClick={onClose}>
      <aside
        className="sidemenu"
        aria-label="תפריט צד"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sidemenu__header">
          <button
            type="button"
            className="sidemenu__close"
            aria-label="סגירה"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* כרטיס פרופיל — עיגול ראשי-תיבות, שם המוסד הפעיל, והמסלול */}
        <div className="sidemenu__profile">
          <div className="sidemenu__avatar" aria-hidden="true">
            {initials(displayName)}
          </div>
          <div className="sidemenu__profile-name">
            <span>{displayName}</span>
            <button
              type="button"
              className="sidemenu__profile-edit"
              aria-label="עריכת פרטי המוסד"
              onClick={() => go("/settings?section=institution")}
            >
              <Icon name="pencil" size={14} />
            </button>
          </div>
          <span className="sidemenu__profile-plan">
            המסלול שלי: {isPro() ? "פרו ✨" : "חינם"}
          </span>
        </div>

        {/* המוסדות שלי — כותרת + הוספת מוסד + מחליף המוסדות */}
        <div className="sidemenu__section-head">
          <h3 className="sidemenu__title">המוסדות שלי</h3>
          <button
            type="button"
            className="sidemenu__add-link"
            onClick={openAddInstitution}
          >
            <Icon name="plus" size={15} /> הוספת מוסד{" "}
            <ProBadge title="הוספת מוסד נוסף — פיצ'ר פרו" />
          </button>
        </div>
        <InstitutionSwitcher onClose={onClose} />

        {/* קבוצת הניהול הראשית */}
        <div className="sidemenu__group">
          <MenuRow
            icon={<Icon name="crown" size={20} />}
            label="מסלול פרו"
            badge={<ProBadge title="כל כלי הפרו במקום אחד" />}
            dataTour="menu-pro"
            onClick={() => go("/upgrade")}
          />
          <MenuRow
            icon={<Icon name="tag" size={20} />}
            label="ספקים"
            onClick={() => go("/gifts")}
          />
          <MenuRow
            icon={<Icon name="wallet" size={20} />}
            label="עריכת גבייה"
            dataTour="menu-collection"
            onClick={() => go("/collection-settings")}
          />
          <MenuRow
            icon={<Icon name="users" size={20} />}
            label="חברי ועד והרשאות"
            badge={<ProBadge title="חברי ועד והרשאות — פיצ'ר פרו" />}
            onClick={() => go("/settings?section=team")}
          />
          <MenuRow
            icon={<Icon name="card" size={20} />}
            label="תשלומים"
            onClick={() => go("/settings?section=payments")}
          />
          <MenuRow
            icon={<Icon name="settings" size={20} />}
            label="הגדרות מערכת"
            dataTour="menu-settings"
            onClick={() => go("/settings")}
          />
        </div>

        {/* אזור המנהלת — מוצג רק ל-SuperAdmin (בעלת VaddyGo), לא לוועדים */}
        {isSuperAdmin() && (
          <>
            <h3 className="sidemenu__title">ניהול VaddyGo</h3>
            <div className="sidemenu__group">
              <MenuRow
                icon={<Icon name="chart" size={20} />}
                label="נתוני שימוש"
                onClick={() => go("/admin/usage")}
              />
            </div>
          </>
        )}

        {/* שירות */}
        <h3 className="sidemenu__title">שירות</h3>
        <div className="sidemenu__group">
          <MenuRow
            icon={<span aria-hidden="true">🧭</span>}
            label="סיור באפליקציה"
            onClick={() => {
              // סוגרים את התפריט ואז מפעילים את הסיור — כדי שהחלוניות יופיעו
              // מעל המסך ולא מתחת לתפריט הפתוח
              onClose();
              startTour();
            }}
          />
          {/* שיתוף קישור ההרשמה — נשאר כי במצב אפליקציה מותקנת אין דרך אחרת לשתף
              (הדפדפן מסתיר את שורת הכתובת ואת כפתור השיתוף שלו). */}
          <MenuRow
            icon={<Icon name="link" size={20} />}
            label="שיתוף קישור להרשמה"
            onClick={() => setIsShareOpen(true)}
          />
          <MenuRow
            icon={<Icon name="phone" size={20} />}
            label="צור קשר"
            href={SUPPORT_URL}
            onClick={onClose}
            tone="contact"
          />
        </div>

        <div className="sidemenu__footer">
          <button type="button" className="sidemenu__logout" onClick={handleLogout}>
            <Icon name="logout" size={18} /> התנתק
          </button>
          <p className="sidemenu__version">VaddyGo 💗</p>
        </div>
      </aside>

      {/* הקישור מוביל ל-/register (מי שמקבל אותו עדיין אינו במערכת). */}
      <ShareLinkModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={`${window.location.origin}/register`}
        title="שיתוף קישור להרשמה"
        message="הנה קישור להרשמה ל-VaddyGo — המערכת שאני מנהלת בה את ועד ההורים"
      />

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
