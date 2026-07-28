import Icon from "./Icon";

/*
  SupplierChecklist — צ'ק-ליסט התחלה לספק: מראה מה עוד חסר כדי שהכרטיס יהיה
  מלא ומזמין ללקוח (וואטסאפ, מוצר, תמונה, אמצעי תשלום, כניסה קבועה). מבוסס על
  מה שכבר נשמר; כשהכל הושלם — נעלם. עוזר לספק חדש לדעת בדיוק מה לעשות.
*/
function SupplierChecklist({ vendor, onGoTo }) {
  const products = vendor?.products || [];
  // view = לאיזה דף הקישור "מילוי »" מוביל כדי להשלים את הפריט
  const items = [
    {
      done: Boolean(vendor?.whatsApp),
      label: "מספר וואטסאפ ליצירת קשר",
      view: "products",
    },
    {
      done: products.some((p) => (p.name || "").trim()),
      label: "מוצר ראשון",
      view: "products",
    },
    {
      done: products.some((p) => (p.imageUrl || "").trim()),
      label: "תמונה לפחות למוצר אחד",
      view: "products",
    },
    {
      done: Boolean(
        vendor?.paymentLink || vendor?.paymentBit || vendor?.paymentBankInfo
      ),
      label: "אמצעי תשלום",
      view: "payments",
    },
    {
      done: Boolean(vendor?.hasLogin),
      label: "הגדרת כניסה קבועה (מייל וסיסמה)",
      view: "home",
    },
  ];
  const doneCount = items.filter((i) => i.done).length;

  // הכל הושלם — אין צורך בצ'ק-ליסט
  if (doneCount === items.length) {
    return null;
  }

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 16,
        margin: "4px 0 16px",
        background: "var(--color-surface)",
      }}
    >
      <p style={{ margin: "0 0 4px", fontWeight: 700 }}>
        ✨ להשלמת הכרטיס ({doneCount}/{items.length})
      </p>
      <p
        style={{
          margin: "0 0 10px",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-muted)",
        }}
      >
        כמה צעדים קטנים כדי שהכרטיס שלכם ייראה מושלם לוועדים:
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item) => (
          <li
            key={item.label}
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
