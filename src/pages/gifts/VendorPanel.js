import { useState } from "react";
import EmptyState from "../../components/EmptyState";
import WhatsAppIcon from "../../components/WhatsAppIcon";
import { formatShekels } from "../../services/format";
import { whatsappUrlWithText } from "../../services/whatsapp";
import { groupByFolder } from "../../services/vendorFolders";

/*
  VendorPanel — דף ספק (UI_SPEC ס' 12): שם הספק → תיקיות לפי חג/אירוע →
  לחיצה על תיקייה פותחת את המוצרים (תמונה + מחיר) עם קישור וואטסאפ לספק
  ובו הודעה מוכנה. מוצג בתוך מודאל בלחיצה על שם ספק. מציגים רק תיקיות עם מוצרים.
*/
// הודעת וואטסאפ מוכנה לספק — מציינת שהוועד הגיע דרך VaddyGo, כדי שהספק ידע
// מאיפה הפנייה. אם נפתחה תיקיית חג ספציפית — מוסיפים את שמה להקשר.
function supplierMessage(folderName) {
  const suffix = folderName && folderName !== "כללי" ? ` ל${folderName}` : "";
  return `היי! 🙂 הגענו אליכם דרך VaddyGo — אפליקציה לניהול ועדי הורים. אנחנו ועד הורים ומעוניינים במוצרים שלכם${suffix}, אפשר לקבל פרטים ומחירים?`;
}

function VendorPanel({
  vendor,
  onEdit,
  onShareEditLink,
  paidTotal = 0,
  readOnly = false,
}) {
  const [openFolder, setOpenFolder] = useState(null);
  // תמונת מוצר להגדלה (לייטבוקס); null = סגור
  const [zoomImage, setZoomImage] = useState(null);
  // פרטי התשלום של הספק אינם מוצגים לוועד עד שלוחצים "תשלום לספק" (רק אז נחשפים)
  const [showPay, setShowPay] = useState(false);
  const folders = groupByFolder(vendor.products || []);
  const hasPayInfo =
    vendor.paymentLink || vendor.paymentBit || vendor.paymentBankInfo;
  // מספר התשלומים שהספק מאפשר (0/1 = תשלום אחד; גדול מ-1 = ניתן לפרוס)
  const installments = Number(vendor.paymentInstallments) || 0;

  // ── תצוגת תיקייה פתוחה: מוצרים + וואטסאפ עם הודעה מוכנה ──
  if (openFolder) {
    const waHref = whatsappUrlWithText(vendor.whatsApp, supplierMessage(openFolder.name));
    return (
      <div className="vendor-panel">
        <button
          type="button"
          className="vendor-panel__back"
          onClick={() => setOpenFolder(null)}
        >
          → חזרה לתיקיות
        </button>
        <h3 className="vendor-panel__folder-title">📁 {openFolder.name}</h3>

        {waHref && (
          <a
            className="btn btn--secondary vendor-panel__wa"
            href={waHref}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon color="#25d366" size={18} /> WhatsApp
          </a>
        )}

        <ul className="vendor-panel__products">
          {openFolder.products.map((product, index) => (
            <li key={index} className="vendor-panel__product">
              {product.imageUrl && (
                <img
                  className="vendor-panel__image"
                  src={product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  onClick={() => setZoomImage(product.imageUrl)}
                  style={{ cursor: "zoom-in" }}
                />
              )}
              <span className="vendor-panel__product-name">{product.name}</span>
              <span className="vendor-panel__price">
                {formatShekels(product.price)}
              </span>
            </li>
          ))}
        </ul>

        {zoomImage && (
          <div
            onClick={() => setZoomImage(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: 16,
              cursor: "zoom-out",
            }}
          >
            <button
              type="button"
              aria-label="סגירת התמונה"
              onClick={() => setZoomImage(null)}
              style={{
                position: "absolute",
                top: 16,
                insetInlineEnd: 16,
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "2px solid #fff",
                background: "rgba(0, 0, 0, 0.55)",
                color: "#fff",
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            <img
              src={zoomImage}
              alt="תמונת המוצר בהגדלה"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: 12,
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // ── רשימת התיקיות (רמה ראשונה) ──
  const whatsapp = whatsappUrlWithText(vendor.whatsApp, supplierMessage(null));
  return (
    <div className="vendor-panel">
      {(vendor.category || vendor.city) && (
        <p className="vendor-panel__meta">
          {vendor.category}
          {vendor.category && vendor.city ? " · " : ""}
          {vendor.city}
        </p>
      )}
      <div className="vendor-panel__contact">
        {whatsapp && (
          <a
            className="btn btn--secondary vendor-panel__wa"
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon color="#25d366" size={18} /> WhatsApp
          </a>
        )}
        {vendor.catalogUrl && (
          <a
            className="vendor-panel__catalog"
            href={vendor.catalogUrl}
            target="_blank"
            rel="noreferrer"
          >
            📖 לקטלוג
          </a>
        )}
      </div>

      {hasPayInfo && (
        <div
          className="vendor-panel__pay"
          style={{ background: "none", padding: 0 }}
        >
          {/* פרטי התשלום מוסתרים כברירת מחדל — נחשפים רק כשהוועד רוצה לשלם */}
          {hasPayInfo &&
            (!showPay ? (
              <button
                type="button"
                className="btn btn--primary vendor-panel__pay-cta"
                onClick={() => setShowPay(true)}
              >
                💳 תשלום לספק
              </button>
            ) : (
              <div className="vendor-panel__pay-open">
                <p className="vendor-panel__pay-title">אפשרויות תשלום לספק</p>
                {installments > 1 && (
                  <p className="vendor-panel__pay-installments">
                    ניתן לפרוס עד {installments} תשלומים
                  </p>
                )}
                {vendor.paymentLink && (
                  <a
                    className="btn btn--primary vendor-panel__pay-cta"
                    href={vendor.paymentLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    💳 מעבר לתשלום מאובטח
                  </a>
                )}
                {vendor.paymentBit && (
                  <p className="vendor-panel__pay-row">
                    ביט: <strong dir="ltr">{vendor.paymentBit}</strong>
                  </p>
                )}
                {vendor.paymentBankInfo && (
                  <p className="vendor-panel__pay-row">
                    העברה בנקאית: <strong>{vendor.paymentBankInfo}</strong>
                  </p>
                )}
              </div>
            ))}
          {paidTotal > 0 && (
            <p className="vendor-panel__pay-row">
              שולם לספק זה עד כה: <strong>{formatShekels(paidTotal)}</strong>
            </p>
          )}
        </div>
      )}

      {vendor.socialLinks && vendor.socialLinks.length > 0 && (
        <div className="vendor-panel__socials">
          {vendor.socialLinks.map((link, index) => (
            <a
              key={index}
              className="vendor-panel__social"
              href={link.url}
              target="_blank"
              rel="noreferrer"
            >
              {link.label || "קישור"}
            </a>
          ))}
        </div>
      )}

      {folders.length > 0 ? (
        <ul className="vendor-folders">
          {folders.map((f) => (
            <li key={f.name}>
              <button
                type="button"
                className="vendor-folders__item"
                onClick={() => setOpenFolder(f)}
              >
                <span className="vendor-folders__icon" aria-hidden="true">
                  📁
                </span>
                <span className="vendor-folders__name">{f.name}</span>
                <span className="vendor-folders__count">
                  {f.products.length} מוצרים
                </span>
                <span className="vendor-folders__chevron" aria-hidden="true">
                  ‹
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="📦" message="עדיין אין מוצרים לספק הזה." />
      )}

      {/* ניהול הספק — רק לבעלת האפליקציה (SuperAdmin); וועד רגיל רק צופה */}
      {!readOnly && (onEdit || onShareEditLink) && (
        <div className="vendor-panel__admin">
          {onEdit && (
            <button type="button" className="vendor-panel__edit" onClick={onEdit}>
              ✏️ עריכת פרטי הספק
            </button>
          )}
          {onShareEditLink && (
            <button
              type="button"
              className="vendor-panel__share"
              onClick={onShareEditLink}
            >
              🔗 שליחת קישור עריכה לספק
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default VendorPanel;
