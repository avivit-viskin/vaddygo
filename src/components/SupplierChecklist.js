import { useState } from "react";
import Icon from "./Icon";
import { vendorChecklist } from "../services/vendorProgress";

/*
  SupplierChecklist — צ'ק-ליסט התחלה לספק: מראה מה עוד חסר כדי שהכרטיס יהיה
  מלא ומזמין ללקוח (וואטסאפ, מוצר, תמונה, אמצעי תשלום, כניסה קבועה). מבוסס על
  מה שכבר נשמר; כשהכל הושלם — נעלם. עוזר לספק חדש לדעת בדיוק מה לעשות.

  אפשר לסגור (X) את החלון — אבל הוא לא נעלם לגמרי: מתכווץ לפס קטן שאפשר ללחוץ
  עליו ולפתוח שוב. מצב הסגירה נזכר במכשיר (localStorage).

  הפריטים עצמם מוגדרים ב-services/vendorProgress — אותו מקור בדיוק שממנו
  המנהלת רואה את דוח ההתקדמות של הספק, כדי ששני הצדדים יראו אותו דבר.
*/
const COLLAPSE_KEY = "vaadygo.supplierChecklistCollapsed";

function SupplierChecklist({ vendor, onGoTo }) {
  const items = vendorChecklist(vendor);
  const doneCount = items.filter((i) => i.done).length;
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  // הכל הושלם — אין צורך בצ'ק-ליסט
  if (doneCount === items.length) {
    return null;
  }

  const close = () => {
    setCollapsed(true);
    try {
      localStorage.setItem(COLLAPSE_KEY, "1");
    } catch {
      /* אין localStorage — לפחות ייסגר לסשן הזה */
    }
  };
  const open = () => {
    setCollapsed(false);
    try {
      localStorage.removeItem(COLLAPSE_KEY);
    } catch {
      /* ignore */
    }
  };

  // מצב מכווץ — לא נעלם: פס קטן שלוחצים עליו כדי לפתוח שוב
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          margin: "4px 0 16px",
          padding: "10px 14px",
          border: "1px solid var(--color-primary)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-primary-light)",
          color: "var(--color-primary-dark)",
          fontFamily: "var(--font-family)",
          fontWeight: 700,
          fontSize: "var(--font-size-sm)",
          cursor: "pointer",
        }}
      >
        <Icon name="star" size={16} />
        <span>
          להשלמת הכרטיס ({doneCount}/{items.length})
        </span>
        <span style={{ marginInlineStart: "auto", fontWeight: 700 }}>הצג ▾</span>
      </button>
    );
  }

  return (
    <div className="card" style={{ margin: "4px 0 16px", position: "relative" }}>
      <button
        type="button"
        aria-label="סגירת החלון"
        onClick={close}
        style={{
          position: "absolute",
          insetInlineEnd: 8,
          top: 8,
          width: 30,
          height: 30,
          border: "none",
          background: "none",
          color: "var(--color-text-muted)",
          fontSize: 18,
          lineHeight: 1,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ✕
      </button>
      <p className="sup-card__title">
        <Icon name="star" size={18} /> להשלמת הכרטיס ({doneCount}/{items.length})
      </p>
      <p className="sup-card__hint">
        כמה צעדים קטנים כדי שהכרטיס שלכם ייראה מושלם לוועדים:
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item) => (
          <li
            key={item.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 0",
              color: item.done ? "var(--color-text-muted)" : "var(--color-text)",
              textDecoration: item.done ? "line-through" : "none",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: item.done
                  ? "none"
                  : "1.6px solid var(--color-border)",
                background: item.done ? "var(--color-primary)" : "transparent",
                color: "var(--color-primary-dark)",
              }}
            >
              {item.done && <Icon name="check" size={14} />}
            </span>
            <span>{item.label}</span>
            {!item.done && onGoTo && (
              <button
                type="button"
                onClick={() => onGoTo(item.view)}
                style={{
                  marginInlineStart: "auto",
                  flexShrink: 0,
                  border: "none",
                  background: "none",
                  color: "var(--color-link)",
                  fontFamily: "var(--font-family)",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                מילוי »
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SupplierChecklist;
