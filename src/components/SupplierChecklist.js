import Icon from "./Icon";
import { vendorChecklist } from "../services/vendorProgress";

/*
  SupplierChecklist — צ'ק-ליסט התחלה לספק: מראה מה עוד חסר כדי שהכרטיס יהיה
  מלא ומזמין ללקוח (וואטסאפ, מוצר, תמונה, אמצעי תשלום, כניסה קבועה). מבוסס על
  מה שכבר נשמר; כשהכל הושלם — נעלם. עוזר לספק חדש לדעת בדיוק מה לעשות.

  הפריטים עצמם מוגדרים ב-services/vendorProgress — אותו מקור בדיוק שממנו
  המנהלת רואה את דוח ההתקדמות של הספק, כדי ששני הצדדים יראו אותו דבר.
*/
function SupplierChecklist({ vendor, onGoTo }) {
  const items = vendorChecklist(vendor);
  const doneCount = items.filter((i) => i.done).length;

  // הכל הושלם — אין צורך בצ'ק-ליסט
  if (doneCount === items.length) {
    return null;
  }

  return (
    <div className="card" style={{ margin: "4px 0 16px" }}>
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
