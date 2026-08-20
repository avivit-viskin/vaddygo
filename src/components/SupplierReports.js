import { useEffect, useState } from "react";
import { getSupplierLeads } from "../services/leadsService";

/*
  SupplierReports — דוחות הספק (פיצ'ר פרו). סיכום צפיות/פניות/מוצרים, פילוח
  הפניות לפי סטטוס (כמה חדשות, נסגרו, לא רלוונטיות...), ועוגת חלוקת המוצרים לפי
  קטגוריה. נתוני המוצרים/הצפיות מגיעים מהכרטיס; הפניות נטענות לפי הטוקן ומתעדכנות
  עם הזמן (כל פתיחה של הדוח).
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

// תוויות/צבעים לפילוח הפניות — תואם לסטטוסים בתיבת הפניות
const LEAD_STATUS = [
  { key: "new", label: "חדשות", color: "#c25c8a" },
  { key: "quoted", label: "הוגשה הצעה", color: "#1f6fbc" },
  { key: "won", label: "נסגרו בהצלחה", color: "#1d8a55" },
  { key: "closed", label: "סגורות", color: "#8a7d84" },
  { key: "irrelevant", label: "לא רלוונטי", color: "#7c8a94" },
];

function SupplierReports({ vendor, token, isPro }) {
  // כל מוצר נספר, גם בלי שם (שם אינו חובה) — אחרת הדוח יראה פחות מוצרים מהאמת
  const products = vendor?.products || [];
  const total = products.length;
  const views = vendor?.views || 0;

  // הפניות בפועל (עם סטטוסים) — לפילוח "כמה נסגרו / לא רלוונטי / חדשות". פרו בלבד;
  // נטען מחדש בכל פתיחה של הדוח, כדי שהמספרים יתעדכנו עם הזמן.
  const [leads, setLeads] = useState(null);
  useEffect(() => {
    if (!isPro || !token) return undefined;
    let alive = true;
    getSupplierLeads(token)
      .then((data) => {
        if (alive) setLeads(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (alive) setLeads([]);
      });
    return () => {
      alive = false;
    };
  }, [token, isPro]);

  // ספירת פניות לפי סטטוס. סה"כ מהפניות שנטענו, ואם עוד לא נטענו — מהמונה שבכרטיס.
  const counts = {};
  (Array.isArray(leads) ? leads : []).forEach((l) => {
    const k = l.status || "new";
    counts[k] = (counts[k] || 0) + 1;
  });
  const leadTotal = Array.isArray(leads) ? leads.length : vendor?.leads || 0;

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
      <h3 className="sup-section-title" style={{ marginTop: 0 }} data-tour="sup-report">
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
        {tile(leadTotal, "פניות")}
        {tile(total, "מוצרים")}
      </div>

      {/* פילוח הפניות לפי סטטוס — כמה חדשות, נסגרו, לא רלוונטיות (פרו בלבד) */}
      {isPro && leadTotal > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 10px", fontSize: "var(--font-size-base)" }}>
            פילוח הפניות
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {LEAD_STATUS.map((s) => (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "var(--color-primary-light)",
                  borderRadius: 10,
                  padding: "6px 11px",
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: s.color,
                    flexShrink: 0,
                  }}
                />
                <span>{s.label}</span>
                <strong style={{ fontVariantNumeric: "tabular-nums" }}>
                  {counts[s.key] || 0}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}

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
