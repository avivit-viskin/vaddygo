import EmptyState from "../../components/EmptyState";
import { formatShekels } from "../../services/format";

/*
  VendorPanel — דף ספק (UI_SPEC ס' 12): מוצרים עם מחירים וקישור לקטלוג.
  מוצג בתוך מודאל כשלוחצים על שם ספק. onEdit פותח את טופס העריכה.
*/
function VendorPanel({ vendor, onEdit }) {
  return (
    <div className="vendor-panel">
      {vendor.catalogUrl && (
        <a
          className="vendor-panel__catalog"
          href={vendor.catalogUrl}
          target="_blank"
          rel="noreferrer"
        >
          📖 לקטלוג של {vendor.name}
        </a>
      )}

      {vendor.products && vendor.products.length > 0 ? (
        <ul className="vendor-panel__products">
          {vendor.products.map((product, index) => (
            <li key={index} className="vendor-panel__product">
              <span>{product.name}</span>
              <span className="vendor-panel__price">
                {formatShekels(product.price)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="📦" message="עדיין אין מוצרים לספק הזה." />
      )}

      <button type="button" className="vendor-panel__edit" onClick={onEdit}>
        ✏️ עריכת פרטי הספק
      </button>
    </div>
  );
}

export default VendorPanel;
