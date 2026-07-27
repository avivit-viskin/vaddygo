import { useState } from "react";
import EmptyState from "../../components/EmptyState";
import { formatShekels } from "../../services/format";
import { whatsappUrl, whatsappUrlWithText } from "../../services/whatsapp";
import { groupByFolder } from "../../services/vendorFolders";

/*
  VendorPanel — דף ספק (UI_SPEC ס' 12): שם הספק → תיקיות לפי חג/אירוע →
  לחיצה על תיקייה פותחת את המוצרים (תמונה + מחיר) עם קישור וואטסאפ לספק
  ובו הודעה מוכנה. מוצג בתוך מודאל בלחיצה על שם ספק. מציגים רק תיקיות עם מוצרים.
*/
function folderMessage(folderName) {
  const suffix = folderName && folderName !== "כללי" ? ` ל${folderName}` : "";
  return `היי! ראינו את המוצרים שלכם${suffix} ואנחנו מעוניינים 🙂 אפשר לקבל פרטים ומחירים?`;
}

function VendorPanel({
  vendor,
  onShareEditLink,
  paidTotal = 0,
  readOnly = false,
}) {
  const [openFolder, setOpenFolder] = useState(null);
  // פרטי התשלום של הספק אינם מוצגים לוועד עד שלוחצים "תשלום לספק" (רק אז נחשפים)
  const [showPay, setShowPay] = useState(false);
  const folders = groupByFolder(vendor.products || []);
  const hasPayInfo =
    vendor.paymentLink || vendor.paymentBit || vendor.paymentBankInfo;
  // מספר התשלומים שהספק מאפשר (0/1 = תשלום אחד; גדול מ-1 = ניתן לפרוס)
  const installments = Number(vendor.paymentInstallments) || 0;

  // ── תצוגת תיקייה פתוחה: מוצרים + וואטסאפ עם הודעה מוכנה ──
  if (openFolder) {
    const waHref = whatsappUrlWithText(vendor.whatsApp, folderMessage(openFolder.name));
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
            💬 וואטסאפ לספק
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
                />
              )}
              <span className="vendor-panel__product-name">{product.name}</span>
              <span className="vendor-panel__price">
                {formatShekels(product.price)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ── רשימת התיקיות (רמה ראשונה) ──
  const whatsapp = whatsappUrl(vendor.whatsApp);
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
            💬 וואטסאפ
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
        <div className="vendor-panel__pay">
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

      {/* עריכת פרטי הספק נעשית אך ורק בעמוד של הספק עצמו (בקישור האישי) —
          הוועד לא עורך ספקים. כאן רק המנהלת שולחת לספק קישור עריכה. */}
      {!readOnly && onShareEditLink && (
        <div className="vendor-panel__admin">
          <button
            type="button"
            className="vendor-panel__share"
            onClick={onShareEditLink}
          >
            🔗 שליחת קישור עריכה לספק
          </button>
        </div>
      )}
    </div>
  );
}

export default VendorPanel;
