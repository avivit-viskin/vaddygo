import { useState } from "react";
import Icon from "./Icon";
import BrandName from "./BrandName";
import ProBadge from "./ProBadge";
import ShareLinkModal from "./ShareLinkModal";
import { whatsappUrlWithText } from "../services/whatsapp";
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

  return (
    <>
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

        <button
          type="button"
          className="sidemenu__action"
          onClick={() => {
            onClose();
            onReport();
          }}
        >
          <Icon name="chart" size={18} /> דוח הספק
        </button>

        <h3 className="sidemenu__title">שיתוף</h3>
        <button
          type="button"
          className="sidemenu__action"
          onClick={() => setShareOpen(true)}
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
          <button
            type="button"
            className="sidemenu__action"
            onClick={() => {
              onClose();
              onStartTour();
            }}
          >
            <span aria-hidden="true">🧭</span> סיור באפליקציה
          </button>
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
