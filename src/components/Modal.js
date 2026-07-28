import { createPortal } from "react-dom";

/*
  Modal — חלון קופץ גנרי. נסגר בלחיצה על הרקע או על כפתור הסגירה.
  isOpen שולט בהצגה; onClose נקרא בכל בקשת סגירה.
  מוצג דרך Portal אל <body> כדי ש-position:fixed ימוקם תמיד יחסית למסך — אחרת,
  כשיש טרנספורם/פילטר על מכל-ביניים (למשל אנימציית מעבר), החלון "בורח" למעלה
  אל ראש התוכן ולא נראה כשהעמוד גלול.
*/
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button
            type="button"
            className="modal__close"
            aria-label="סגירה"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
