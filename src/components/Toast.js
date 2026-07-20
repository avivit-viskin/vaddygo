import { useCallback, useEffect, useState } from "react";
import { subscribeToasts } from "../services/toastBus";
import "../styles/toast.css";

/*
  ToastContainer — מציג הודעות קצרות ("השינויים נשמרו ✓" / "שגיאה, לא נשמר")
  שמגיעות מה-toastBus (בעיקר משכבת ה-API). כל הודעה נעלמת לבד אחרי כמה שניות,
  ואפשר לסגור ידנית. הודעות זהות מתאחדות כדי לא להציף (מחיקה גורפת = הודעה אחת).
  מוצג פעם אחת ב-App.
*/
const AUTO_DISMISS_MS = 3500;

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className={`toast toast--${toast.type}`}>
      <span className="toast__icon" aria-hidden="true">
        {toast.type === "success" ? "✓" : "⚠"}
      </span>
      <span className="toast__message">{toast.message}</span>
      <button
        type="button"
        className="toast__close"
        aria-label="סגירת ההודעה"
        onClick={() => onDismiss(toast.id)}
      >
        ✕
      </button>
    </div>
  );
}

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    return subscribeToasts((toast) => {
      setToasts((prev) => {
        // איחוד: אם כבר מוצגת הודעה זהה (אותו סוג ואותו טקסט) — לא מוסיפים כפולה
        if (prev.some((t) => t.type === toast.type && t.message === toast.message)) {
          return prev;
        }
        return [...prev, toast];
      });
    });
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container" aria-live="polite" role="status">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}

export default ToastContainer;
