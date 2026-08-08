/*
  SupplierReports — דוחות הספק (פיצ'ר פרו). סיכום צפיות/פניות/מוצרים ועוגת
  חלוקת המוצרים לפי קטגוריה (תיקייה) להבנה מהירה. הנתונים מגיעים מהכרטיס עצמו
  (products, views, leads) — בלי בקשה נוספת.
  הערה: פילוח לפי טווח תאריכים ידרוש תיעוד אירועים עם חותמת-זמן (שדרוג עתידי).
*/
const PIE_COLORS = [
  "#f2b8d0",
  "#a7d3d8",
  "#f6d9a8",
  "#c9b6e4",
  "#b7e6cd",
  "#f5b7b1",
  "#cdd8a6",
  "#eac3d1",
];

function SupplierReports({ vendor }) {
  // כל מוצר נספר, גם בלי שם (שם אינו חובה) — אחרת הדוח יראה פחות מוצרים מהאמת
  const products = vendor?.products || [];
  const total = products.length;
  const views = vendor?.views || 0;
  const leads = vendor?.leads || 0;

  // חלוקת מוצרים לפי קטגוריה (תיקייה); בלי תיקייה = "כללי"
  const byCat = {};
  products.forEach((p) => {
    const cat = (p.folder || "").trim() || "כללי";
    byCat[cat] = (byCat[cat] || 0) + 1;
  });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  // מקטעי העוגה (conic-gradient) — בלי ספריות חיצוניות
  let acc = 0;
  const stops = cats
    .map(([, n], i) => {
      const start = (acc / total) * 100;
      acc += n;
      const end = (acc / total) * 100;
      return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${end}%`;
    })
    .join(", ");

  const tile = (num, label) => (
    <div
      style={{
        flex: 1,
        textAlign: "center",
        background: "var(--color-primary-light)",
        borderRadius: "var(--radius-lg)",
        padding: "12px 8px",
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary-dark)" }}>
        {num}
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{label}</div>
    </div>
  );

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: 16,
        background: "var(--color-surface)",
      }}
    >
      <h3 className="sup-section-title" style={{ marginTop: 0 }}>
        📊 דוחות
      </h3>

      {vendor?.featured && (
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #f0d488",
            color: "#8a6d1a",
            borderRadius: 8,
            padding: "6px 12px",
            marginBottom: 12,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          ⭐ אתם מסומנים כספק מומלץ — מופיעים בראש הרשימה לוועדים
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {tile(views, "צפיות")}
        {tile(leads, "פניות")}
        {tile(total, "מוצרים")}
      </div>

      <h4 style={{ margin: "0 0 10px", fontSize: "var(--font-size-base)" }}>
        מוצרים לפי קטגוריה
      </h4>
      {total === 0 ? (
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
          עדיין אין מוצרים להצגה.
        </p>
      ) : (
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div
            aria-hidden="true"
            style={{
              width: 130,
              height: 130,
              borderRadius: "50%",
              background: `conic-gradient(${stops})`,
              flexShrink: 0,
            }}
          />
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              flex: 1,
              minWidth: 150,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {cats.map(([cat, n], i) => (
              <li
                key={cat}
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: PIE_COLORS[i % PIE_COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1 }}>{cat}</span>
                <span
                  style={{
                    color: "var(--color-text-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {n} · {Math.round((n / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SupplierReports;
