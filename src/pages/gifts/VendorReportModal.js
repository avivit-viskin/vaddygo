import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import WhatsAppIcon from "../../components/WhatsAppIcon";
import CopyMessageButton from "../../components/CopyMessageButton";
import SupplierReports from "../../components/SupplierReports";
import { vendorProgress, vendorReportText } from "../../services/vendorProgress";
import { getVendorLeads } from "../../services/vendorsService";
import { whatsappUrlWithText } from "../../services/whatsapp";
import "../../styles/vendor-report.css";

/*
  VendorReportModal — הדוח של ספק בעיניי המנהלת (SuperAdmin): כמה הכרטיס שלו
  מוכן, מה עדיין חסר, וכמה צפיות/פניות/מוצרים יש לו — ואפשרות לשתף איתו את
  הדוח כדי שיֵדע מה להשלים.

  התוכן אינו משוכפל: הסטטיסטיקות מגיעות מ-SupplierReports (אותו רכיב שהספק
  רואה בפורטל שלו) וההתקדמות מ-services/vendorProgress (אותו מקור שממנו נבנה
  הצ'ק-ליסט של הספק). כאן רק מוסיפים את מבט המנהלת: פעילות (כניסה/עריכה
  אחרונה), התמונות של הספק, והשיתוף.
*/
// תאריך+שעה קצרים בעברית, או "עדיין לא" כשאין (ספק שלא התחבר/ערך, או לפני השדה).
function formatWhen(iso) {
  if (!iso) {
    return "עדיין לא";
  }
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString("he-IL")} ${d.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return "לא ידוע";
  }
}

function VendorReportModal({ vendor, onClose }) {
  // מי פנה לספק (שם+טלפון) — נטען מנקודת-קצה שמורה למנהלת (SuperAdmin). הספק
  // עצמו רואה את הפניות בתיבת הפניות שלו; כאן זה מבט המנהלת בלבד.
  const [leads, setLeads] = useState(null);
  useEffect(() => {
    if (!vendor?.id) return undefined;
    let alive = true;
    getVendorLeads(vendor.id)
      .then((data) => {
        if (alive) setLeads(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (alive) setLeads([]);
      });
    return () => {
      alive = false;
    };
  }, [vendor?.id]);

  if (!vendor) {
    return null;
  }

  const { items, done, total, percent, missing } = vendorProgress(vendor);
  const reportText = vendorReportText(vendor);
  // התמונות שהספק העלה — כדי שהמנהלת "תראה את התמונות שלו" בלי לצאת מהדוח
  const productImages = (vendor.products || [])
    .map((p) => p.imageUrl)
    .filter(Boolean);

  return (
    <Modal isOpen onClose={onClose} title={`דוח ספק — ${vendor.name}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <p
            style={{
              margin: "0 0 6px",
              fontWeight: 700,
              color: "var(--color-primary-dark)",
            }}
          >
            השלמת הכרטיס: {done} מתוך {total} ({percent}%)
          </p>
          {/* בר התקדמות — אותו דפוס ויזואלי של כרטיס הגבייה במסך הבית */}
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`השלמת הכרטיס של ${vendor.name}`}
            style={{
              height: 10,
              borderRadius: 999,
              background: "var(--color-primary-light)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                background: "var(--color-primary)",
              }}
            />
          </div>
        </div>

        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {items.map((item) => (
            <li
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 0",
                color: item.done
                  ? "var(--color-text-muted)"
                  : "var(--color-text)",
              }}
            >
              <Icon name={item.done ? "check" : "clock"} size={16} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>

        <SupplierReports vendor={vendor} />

        {/* מי פנה לספק — שם וטלפון של כל פנייה. מבט המנהלת בלבד (נטען מנקודת-קצה
            SuperAdmin); אין מייל — הפנייה שומרת שם וטלפון בלבד. */}
        {Array.isArray(leads) && leads.length > 0 && (
          <div>
            <p
              style={{
                margin: "0 0 8px",
                fontWeight: 700,
                color: "var(--color-primary-dark)",
              }}
            >
              מי פנה לספק ({leads.length})
            </p>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {leads.map((l) => (
                <li
                  key={l.id}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    gap: "2px 10px",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--color-border)",
                    fontSize: 14,
                  }}
                >
                  <strong>{l.contactName || l.committeeName || "פנייה"}</strong>
                  {l.committeeName && l.contactName && (
                    <span style={{ color: "var(--color-text-muted)" }}>
                      ({l.committeeName})
                    </span>
                  )}
                  {l.contactPhone && (
                    <a
                      href={`tel:${l.contactPhone}`}
                      style={{ color: "var(--color-link)" }}
                      title="טלפון הפונה"
                    >
                      ☎ {l.contactPhone}
                    </a>
                  )}
                  {l.subject && (
                    <span style={{ color: "var(--color-text-muted)" }}>
                      · {l.subject}
                    </span>
                  )}
                  {l.createdAt && (
                    <span
                      style={{
                        color: "var(--color-text-muted)",
                        marginInlineStart: "auto",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {new Date(l.createdAt).toLocaleDateString("he-IL")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* פעילות הספק — מתי התחבר ומתי ערך לאחרונה (עד כמה הוא פעיל) */}
        <div className="vendor-report__activity">
          <p className="vendor-report__activity-row">
            <Icon name="clock" size={15} /> כניסה אחרונה:{" "}
            <strong>{formatWhen(vendor.lastLoginAt)}</strong>
          </p>
          <p className="vendor-report__activity-row">
            <Icon name="pencil" size={15} /> עריכה אחרונה:{" "}
            <strong>{formatWhen(vendor.lastEditedAt)}</strong>
          </p>
          {vendor.createdAt && (
            <p className="vendor-report__activity-row">
              <Icon name="calendar" size={15} /> נרשם:{" "}
              <strong>{formatWhen(vendor.createdAt)}</strong>
            </p>
          )}
        </div>

        {/* התמונות של הספק — תצוגה מקדימה, כדי לראות מה הוא מציג לוועדים */}
        {productImages.length > 0 && (
          <div>
            <p className="vendor-report__images-title">
              התמונות של הספק ({productImages.length})
            </p>
            <div className="vendor-report__images">
              {productImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="vendor-report__thumb"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
            }}
          >
            {missing.length > 0
              ? "אפשר לשלוח לספק את הדוח כדי שיֵדע מה נשאר להשלים."
              : "הכרטיס של הספק מלא — אפשר לשלוח לו את הדוח כעדכון."}
          </p>
          <div className="form-actions vendor-report__actions">
            <a
              className="btn btn--primary"
              href={whatsappUrlWithText(vendor.whatsApp, reportText)}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon size={18} /> שיתוף הדוח בוואטסאפ
            </a>
            <CopyMessageButton text={reportText} label="העתקת הדוח" />
            {/* "סגירת הדוח" ולא "סגירה" — כדי לא לשכפל את השם הנגיש של ✕ */}
            <Button variant="secondary" onClick={onClose}>
              סגירת הדוח
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default VendorReportModal;
