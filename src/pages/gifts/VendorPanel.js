import EmptyState from "../../components/EmptyState";
import { formatShekels } from "../../services/format";
import { whatsappUrl } from "../../services/whatsapp";

/*
  VendorPanel — דף ספק (UI_SPEC ס' 12): תמונות מוצרים ומחירים, כפתור וואטסאפ,
  קישורים לרשתות חברתיות וקישור לקטלוג. מוצג בתוך מודאל בלחיצה על שם ספק.
*/
function VendorPanel({ vendor, onEdit, readOnly = false }) {
  const whatsapp = whatsappUrl(vendor.whatsApp);

  return (
    <div className="vendor-panel">
      <div className="vendor-panel__contact">
        {whatsapp && (
          <a
            className="vendor-panel__whatsapp"
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

      {vendor.products && vendor.products.length > 0 ? (
        <ul className="vendor-panel__products">
          {vendor.products.map((product, index) => (
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
      ) : (
        <EmptyState icon="📦" message="עדיין אין מוצרים לספק הזה." />
      )}

      {/* "צופה" — לצפייה בלבד: בלי עריכת פרטי הספק */}
      {!readOnly && (
        <button type="button" className="vendor-panel__edit" onClick={onEdit}>
          ✏️ עריכת פרטי הספק
        </button>
      )}
    </div>
  );
}

export default VendorPanel;
