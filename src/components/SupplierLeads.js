import { useCallback, useEffect, useState } from "react";
import ProBadge from "./ProBadge";
import WhatsAppIcon from "./WhatsAppIcon";
import { getSupplierLeads, updateLeadStatus } from "../services/leadsService";
import { whatsappUrlWithText } from "../services/whatsapp";
import { formatShekels, formatDayMonth } from "../services/format";

/*
  SupplierLeads — תיבת הפניות (בקשות הצעת מחיר / RFQ) של הספק (פיצ'ר Pro).
  מציג את הבקשות שוועדים שלחו: מה מבקשים, כמות/תאריך/תקציב, הודעה ופרטי קשר,
  עם כפתורי חזרה (וואטסאפ/טלפון) וסימון סטטוס לניהול. הנתונים לפי טוקן הספק.
  נטען בכניסה, בלחיצה על "רענון", וגם כשחוזרים ללשונית (focus) — כך שפנייה
  חדשה מופיעה בלי לטעון מחדש את כל הפורטל.
*/
const STATUS = {
  new: { label: "חדש", color: "#c25c8a" },
  quoted: { label: "הוגשה הצעה", color: "#1f6fbc" },
  won: { label: "נסגר בהצלחה", color: "#1d8a55" },
  closed: { label: "סגור", color: "#8a7d84" },
  irrelevant: { label: "לא רלוונטי", color: "#7c8a94" },
};
const ORDER = ["new", "quoted", "won", "closed", "irrelevant"];

const box = {
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: 16,
  background: "var(--color-surface)",
};

/*
  הודעת וואטסאפ מוכנה שהספק שולח לוועד — כוללת את פרטי הבקשה שהוועד מילא (כמות,
  מוצר, תאריך אירוע, תקציב), כדי שהפנייה תהיה אישית ולא גנרית. בונים רק מהחלקים
  שקיימים בפועל. דוגמה: "היי דנה! 🙂 כאן מגשי שרה. ראיתי שהתעניינת ב-10 מגשים,
  לאירוע ב-17.8, בתקציב של 1,500 ₪. מתי יהיה אפשר לשוחח?"
*/
function buildLeadWhatsApp(lead, vendorName) {
  const hi = `היי${lead.contactName ? ` ${lead.contactName}` : ""}! 🙂`;
  const who = vendorName ? ` כאן ${vendorName}.` : "";
  const item = (lead.subject || "").trim();
  let saw = "ראיתי שהתעניינת";
  if (lead.quantity && item) {
    saw += ` ב-${lead.quantity} ${item}`;
  } else if (item) {
    saw += ` ב${item}`;
  } else if (lead.quantity) {
    saw += ` ב-${lead.quantity} יחידות`;
  } else {
    saw += " במה שאנחנו מציעים";
  }
  if (lead.eventDate) {
    saw += `, לאירוע ב-${formatDayMonth(lead.eventDate)}`;
  }
  if (lead.budget) {
    saw += `, בתקציב של ${formatShekels(lead.budget)}`;
  }
  saw += ".";
  return `${hi}${who} ${saw} מתי יהיה אפשר לשוחח?`;
}

function SupplierLeads({ token, isPro, vendorName }) {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  // סינון לפי סטטוס — הדיפולט תמיד "חדש" (מתאפס בכל כניסה/מעבר דף; לא נשמר בהעדפה).
  const [statusFilter, setStatusFilter] = useState("new");
  // קיפול התיבה — נשמר בהעדפה כדי שתישאר סגורה גם אחרי רענון/מעבר דף
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("vaddygo.leads.collapsed") === "1";
    } catch {
      return false;
    }
  });
  function toggleCollapsed(next) {
    setCollapsed(next);
    try {
      localStorage.setItem("vaddygo.leads.collapsed", next ? "1" : "0");
    } catch {
      /* אחסון חסום — לא קריטי */
    }
  }

  const load = useCallback(() => {
    if (!isPro || !token) {
      return;
    }
    setRefreshing(true);
    setError("");
    getSupplierLeads(token)
      .then((data) => setLeads(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "לא הצלחנו לטעון את הפניות"))
      .finally(() => setRefreshing(false));
  }, [token, isPro]);

  // טעינה בכניסה + רענון אוטומטי כשחוזרים ללשונית (מספיק לשלוח פנייה בכרטיס
  // הספק, לחזור לפורטל, והיא כבר כאן)
  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  async function changeStatus(id, status) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await updateLeadStatus(token, id, status);
    } catch {
      // השינוי כבר מוצג מקומית; סנכרון חוזר בטעינה הבאה
    }
  }

  // פיצ'ר פרו — לספק שאינו במסלול פרו מציגים הזמנה לשדרוג (כמו SupplierOffer)
  if (!isPro) {
    return (
      <div style={box}>
        <h3 className="sup-section-title" style={{ marginTop: 0 }}>
          📨 תיבת פניות <ProBadge title="פיצ'ר פרו" isPro={isPro} />
        </h3>
        <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
          כאן יופיעו בקשות הצעת מחיר מוועדים — עם כל הפרטים ואפשרות לחזור בלחיצה.
          זהו פיצ'ר של מסלול הפרו 👑 — לפתיחה, פנו למנהלת VaddyGo.
        </p>
      </div>
    );
  }

  // תיבה מקופלת — מציגים רק "ידית" קטנה לפתיחה (הפניות עדיין נטענות ברקע כדי
  // להראות את המונה). לחיצה פותחת חזרה את התיבה המלאה.
  if (collapsed) {
    const count = Array.isArray(leads) ? leads.length : null;
    return (
      <button
        type="button"
        onClick={() => toggleCollapsed(false)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          background: "var(--color-surface)",
          padding: "12px 16px",
          fontFamily: "var(--font-family)",
          fontSize: "var(--font-size-base)",
          fontWeight: 700,
          color: "var(--color-primary-dark)",
          cursor: "pointer",
        }}
      >
        📨 תיבת פניות
        {count ? (
          <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
            ({count})
          </span>
        ) : null}
        <span
          style={{
            marginInlineStart: "auto",
            color: "#c25c8a",
            fontWeight: 700,
          }}
        >
          פתיחה ▾
        </span>
      </button>
    );
  }

  const visibleLeads = statusFilter
    ? (leads || []).filter((l) => l.status === statusFilter)
    : leads || [];

  return (
    <div style={box}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h3 className="sup-section-title" style={{ margin: 0, flex: 1 }}>
          📨 תיבת פניות{" "}
          {Array.isArray(leads) && leads.length > 0 && (
            <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
              ({leads.length})
            </span>
          )}
        </h3>
        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          style={{
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            borderRadius: 8,
            padding: "6px 12px",
            fontFamily: "var(--font-family)",
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            color: "var(--color-primary-dark)",
            cursor: refreshing ? "default" : "pointer",
          }}
        >
          {refreshing ? "מרענן…" : "↻ רענון"}
        </button>
        <button
          type="button"
          onClick={() => toggleCollapsed(true)}
          aria-label="סגירת תיבת הפניות"
          title="סגירה"
          style={{
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            borderRadius: 8,
            padding: "6px 10px",
            fontFamily: "var(--font-family)",
            fontSize: "var(--font-size-sm)",
            fontWeight: 700,
            color: "var(--color-text-muted)",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {error && <p className="field__error">{error}</p>}
      {!error && leads === null && (
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>טוען פניות…</p>
      )}
      {!error && Array.isArray(leads) && leads.length === 0 && (
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
          עדיין אין פניות. כשוועד ישלח בקשת הצעת מחיר — היא תופיע כאן (אפשר גם ללחוץ "רענון").
        </p>
      )}

      {/* סינון לפי סטטוס — "ללא סינון" מציג את כל הפניות */}
      {Array.isArray(leads) && leads.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {[{ k: "", label: "ללא סינון" }, ...ORDER.map((k) => ({ k, label: STATUS[k].label }))].map(
            ({ k, label }) => {
              const active = statusFilter === k;
              // צבע הסטטוס (חדש=ורוד, הצעה=כחול, נסגר=ירוק, סגור/לא-רלוונטי=אפור);
              // "ללא סינון" בורוד המותג. פעיל = מילוי מלא, לא-פעיל = מתאר בצבע.
              const c = k ? STATUS[k].color : "var(--color-primary-dark)";
              return (
                <button
                  key={k || "all"}
                  type="button"
                  onClick={() => setStatusFilter(k)}
                  style={{
                    border: `1px solid ${c}`,
                    background: active ? c : "var(--color-surface)",
                    color: active ? "#fff" : c,
                    borderRadius: 999,
                    padding: "5px 12px",
                    fontFamily: "var(--font-family)",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: active ? 700 : 600,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            }
          )}
        </div>
      )}

      {Array.isArray(leads) && leads.length > 0 && visibleLeads.length === 0 && (
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
          אין פניות בסטטוס הזה — אפשר ללחוץ "ללא סינון".
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {visibleLeads.map((lead) => {
          const s = STATUS[lead.status] || STATUS.new;
          const waMsg = buildLeadWhatsApp(lead, vendorName);
          return (
            <li key={lead.id} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <strong style={{ flex: 1 }}>{lead.committeeName || "ועד הורים"}</strong>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  {formatDayMonth(lead.createdAt)}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: s.color, borderRadius: 999, padding: "2px 10px" }}>
                  {s.label}
                </span>
              </div>

              {lead.subject && (
                <p style={{ margin: "8px 0 4px", fontWeight: 600 }}>{lead.subject}</p>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "4px 0" }}>
                {lead.quantity ? <Chip>כמות: {lead.quantity}</Chip> : null}
                {lead.eventDate ? <Chip>לאירוע: {formatDayMonth(lead.eventDate)}</Chip> : null}
                {lead.budget ? <Chip>תקציב: {formatShekels(lead.budget)}</Chip> : null}
              </div>

              {lead.message && (
                <p style={{ margin: "4px 0", color: "var(--color-text)", fontSize: "var(--font-size-sm)" }}>
                  {lead.message}
                </p>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 8 }}>
                {lead.contactPhone && (
                  <>
                    <a
                      href={whatsappUrlWithText(lead.contactPhone, waMsg)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn--secondary"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
                    >
                      <WhatsAppIcon color="#25d366" size={16} /> וואטסאפ
                    </a>
                    <a href={`tel:${lead.contactPhone}`} className="btn btn--secondary" style={{ textDecoration: "none" }}>
                      ☎ {lead.contactPhone}
                    </a>
                  </>
                )}
                <label style={{ marginInlineStart: "auto", fontSize: "var(--font-size-sm)", display: "flex", alignItems: "center", gap: 6 }}>
                  סטטוס:
                  <select
                    className="field__input"
                    value={lead.status}
                    onChange={(e) => changeStatus(lead.id, e.target.value)}
                    style={{ width: "auto", padding: "4px 8px" }}
                  >
                    {ORDER.map((k) => (
                      <option key={k} value={k}>
                        {STATUS[k].label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span
      style={{
        fontSize: 12,
        background: "var(--color-primary-light)",
        color: "var(--color-primary-dark)",
        borderRadius: 8,
        padding: "3px 8px",
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

export default SupplierLeads;
