import Modal from "../../components/Modal";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import WhatsAppIcon from "../../components/WhatsAppIcon";
import CopyMessageButton from "../../components/CopyMessageButton";
import SupplierReports from "../../components/SupplierReports";
import { vendorProgress, vendorReportText } from "../../services/vendorProgress";
import { whatsappUrlWithText } from "../../services/whatsapp";
import "../../styles/vendor-report.css";

/*
  VendorReportModal — הדוח של ספק בעיניי המנהלת (SuperAdmin): כמה הכרטיס שלו
  מוכן, מה עדיין חסר, וכמה צפיות/פניות/מוצרים יש לו — ואפשרות לשתף איתו את
  הדוח כדי שיֵדע מה להשלים.

  התוכן אינו משוכפל: הסטטיסטיקות מגיעות מ-SupplierReports (אותו רכיב שהספק
  רואה בפורטל שלו) וההתקדמות מ-services/vendorProgress (אותו מקור שממנו נבנה
  הצ'ק-ליסט של הספק). כאן רק מוסיפים את מבט המנהלת ואת השיתוף.
*/
function VendorReportModal({ vendor, onClose }) {
  if (!vendor) {
    return null;
  }

  const { items, done, total, percent, missing } = vendorProgress(vendor);
  const reportText = vendorReportText(vendor);

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
