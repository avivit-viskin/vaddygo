import { useState } from "react";
import Icon from "./Icon";
import ProBadge from "./ProBadge";
import ShareLinkModal from "./ShareLinkModal";
import { whatsappUrlWithText } from "../services/whatsapp";
import "../styles/sidemenu.css";

/*
  SupplierSideMenu — תפריט הצד של אזור הספק, **בעיצוב זהה לתפריט של בעלי
  המוסדות** (SideMenu): כרטיס פרופיל למעלה (עיגול ראשי-תיבות + שם העסק + המסלול),
  ואז קבוצות של שורות מעוצבות (אייקון + תווית + חץ). כולל שדרוגי פרו, דוח,
  שיתוף, החשבון וההגדרות, סיור, צור קשר והתנתקות.
*/
// מספר הוואטסאפ/תמיכה של VaddyGo (ציבורי — לא סוד)
const SUPPORT_PHONE = "054-4579179";

// ראשי-תיבות לעיגול הפרופיל (שתי המילים הראשונות של שם העסק)
function initials(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ספ";
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

/* שורת פעולה בתפריט — אייקון בהתחלה, תווית (ואולי תג פרו), וחץ בסוף. */
function Row({ icon, label, badge, onClick, href, tone }) {
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
      <a className={cls} href={href} target="_blank" rel="noreferrer" onClick={onClick}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}

function SupplierSideMenu({
  isOpen,
  isPro,
  name,
  onClose,
  onUpgrade,
  onReport,
  onSettings,
  onChangeName,
  onChangePassword,
  onCookies,
  onDeleteRequest,
  onStartTour,
  onLogout,
}) {
  const [shareOpen, setShareOpen] = useState(false);

  if (!isOpen) {
    return null;
  }

  const contactUrl = whatsappUrlWithText(
    SUPPORT_PHONE,
    "שלום, אשמח לעזרה עם פורטל הספקים של VaddyGo 🙂"
  );
  const displayName = name || "העסק שלי";
  const act = (fn) => () => {
    onClose();
    fn();
  };

  return (
    <>
      <div className="sidemenu-overlay" onClick={onClose}>
        <aside
          className="sidemenu"
          aria-label="תפריט ספק"
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

          {/* כרטיס פרופיל — עיגול ראשי-תיבות, שם העסק, והמסלול */}
          <div className="sidemenu__profile">
            <div className="sidemenu__avatar" aria-hidden="true">
              {initials(displayName)}
            </div>
            <div className="sidemenu__profile-name">
              <span>{displayName}</span>
              <button
                type="button"
                className="sidemenu__profile-edit"
                aria-label="עריכת שם העסק"
                onClick={act(onChangeName)}
              >
                <Icon name="pencil" size={14} />
              </button>
            </div>
            <span className="sidemenu__profile-plan">
              המסלול שלי: {isPro ? "פרו ✨" : "חינם"}
            </span>
          </div>

          {/* קבוצת פרו + דוח */}
          <div className="sidemenu__group">
            <Row
              icon={<Icon name="crown" size={20} />}
              label="שדרוגי פרו"
              badge={<ProBadge title="כל כלי הפרו של הספק במקום אחד" isPro={isPro} />}
              onClick={act(onUpgrade)}
            />
            <Row
              icon={<Icon name="chart" size={20} />}
              label="דוח הספק"
              onClick={act(onReport)}
            />
            <Row
              icon={<Icon name="link" size={20} />}
              label="שיתוף פורטל הספקים"
              onClick={() => setShareOpen(true)}
            />
          </div>

          {/* החשבון וההגדרות */}
          <h3 className="sidemenu__title">החשבון וההגדרות</h3>
          <div className="sidemenu__group">
            <Row
              icon={<Icon name="settings" size={20} />}
              label="הגדרות משתמש"
              onClick={act(onSettings)}
            />
            <Row
              icon={<Icon name="pencil" size={20} />}
              label="שם העסק"
              onClick={act(onChangeName)}
            />
            <Row
              icon={<Icon name="key" size={20} />}
              label="חשבון וסיסמה"
              onClick={act(onChangePassword)}
            />
            <Row
              icon={<Icon name="settings" size={20} />}
              label="הגדרות עוגיות"
              onClick={act(onCookies)}
            />
            <Row
              icon={<Icon name="trash" size={20} />}
              label="מחיקת החשבון"
              onClick={act(onDeleteRequest)}
            />
          </div>

          {/* שירות */}
          <h3 className="sidemenu__title">שירות</h3>
          <div className="sidemenu__group">
            <Row
              icon={<span aria-hidden="true">🧭</span>}
              label="סיור באפליקציה"
              onClick={act(onStartTour)}
            />
            <Row
              icon={<Icon name="phone" size={20} />}
              label="צור קשר"
              href={contactUrl}
              onClick={onClose}
              tone="contact"
            />
          </div>

          <div className="sidemenu__footer">
            <button type="button" className="sidemenu__logout" onClick={onLogout}>
              <Icon name="logout" size={18} /> התנתק
            </button>
            <p className="sidemenu__version">VaddyGo 💗</p>
          </div>
        </aside>
      </div>
      <ShareLinkModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        url={`${window.location.origin}/suppliers`}
        title="שיתוף פורטל הספקים"
        message="מוזמנים להצטרף כספקים ל-VaddyGo — לנהל קטלוג מוצרים שוועדי הורים רואים ומזמינים ממנו:"
      />
    </>
  );
}

export default SupplierSideMenu;
