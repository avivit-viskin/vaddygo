import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { whatsappShareUrl } from "../services/whatsapp";

/*
  ShareLinkModal — חלון שיתוף קישור שעובד בכל דפדפן, כולל מחשב.

  למה חלון ולא navigator.share ישיר: במחשב לרוב אין תפריט שיתוף מובנה
  (navigator.share), וכשהוא כן קיים וביטלו אותו — לא קרה כלום והמשתמשת חשבה
  ש"אי אפשר לשלוח". כאן הקישור תמיד גלוי לבחירה, יש כפתור "העתקה" עם נפילה
  ל-execCommand (כמו CopyMessageButton), וכפתור "שליחה בוואטסאפ" (וואטסאפ ווב
  במחשב / אפליקציה בנייד). שיתוף מובנה מוצג רק כתוספת אם קיים.
*/
function ShareLinkModal({
  isOpen,
  onClose,
  url,
  title = "שיתוף קישור",
  message = "",
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // נפילה לדפדפנים/הקשרים שבהם clipboard חסום — העתקה דרך שדה זמני
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        // אין מה לעשות — הקישור גלוי בשדה, אפשר לסמן ולהעתיק ידנית
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function nativeShare() {
    try {
      await navigator.share({ title, text: message, url });
      onClose();
    } catch {
      // בוטל/נכשל — נשארים בחלון עם כפתורי ההעתקה/וואטסאפ
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p style={{ margin: "0 0 12px", color: "var(--color-text)" }}>
        הקישור מוכן — אפשר להעתיק אותו, או לשלוח ישירות בוואטסאפ.
      </p>
      <input
        type="text"
        readOnly
        value={url || ""}
        onFocus={(e) => e.target.select()}
        onClick={(e) => e.target.select()}
        aria-label="הקישור לשיתוף"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md, 10px)",
          background: "var(--color-bg)",
          color: "var(--color-text)",
          fontSize: "var(--font-size-sm)",
          direction: "ltr",
          textAlign: "left",
        }}
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        <Button onClick={copyLink}>
          {copied ? "הועתק! ✓" : "העתקת הקישור"}
        </Button>
        <a
          href={whatsappShareUrl(`${message}\n${url}`.trim())}
          target="_blank"
          rel="noreferrer"
          onClick={onClose}
        >
          <Button variant="secondary">שליחה בוואטסאפ 💬</Button>
        </a>
        {canNativeShare && (
          <Button variant="secondary" onClick={nativeShare}>
            שיתוף…
          </Button>
        )}
      </div>
    </Modal>
  );
}

export default ShareLinkModal;
