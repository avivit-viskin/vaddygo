import { useEffect, useRef, useState } from "react";
import "../styles/institutionAvatar.css";

/*
  SupplierAvatar — עיגול בכותרת אזור הספק עם ראשי התיבות של שם העסק (המילה
  הראשונה + השנייה). לחיצה פותחת פופאפ קטן עם שם העסק המלא ומייל ההתחברות —
  בדיוק כמו אווטאר הגן בכניסת הוועד. משתמש בעיצוב המשותף (institutionAvatar.css);
  האווטאר יושב בצד שמאל של ההדר, ולכן הפופאפ נפתח פנימה (ימינה) כדי שלא ייחתך.
*/
function initials(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
}

function SupplierAvatar({ name, email }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // סגירה בלחיצה מחוץ לפופאפ
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function handleOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div className="inst-avatar" ref={ref}>
      <button
        type="button"
        className="inst-avatar__circle"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`פרטי החשבון של ${name || "הספק"}`}
        aria-expanded={open}
      >
        {initials(name)}
      </button>
      {open && (
        <div
          className="inst-avatar__popup"
          role="dialog"
          aria-label="פרטי החשבון"
          style={{ insetInlineStart: "auto", insetInlineEnd: 0 }}
        >
          <strong className="inst-avatar__name">{name || "ספק"}</strong>
          {email ? (
            <span className="inst-avatar__email">{email}</span>
          ) : (
            <span className="inst-avatar__email">
              נכנסת דרך קישור אישי (בלי מייל)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default SupplierAvatar;
