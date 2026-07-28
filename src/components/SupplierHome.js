import { useState } from "react";
import EmptyState from "./EmptyState";
import Icon from "./Icon";
import { formatShekels } from "../services/format";
import { groupByFolder } from "../services/vendorFolders";

/*
  SupplierHome — דף הבית של הספק: כמה מוצרים העלה, והמוצרים מסודרים בתוך
  התיקיות (חג/אירוע) עם תמונה ומחיר. ליד תמונה שהרזולוציה שלה נמוכה מוצגת
  התראה קטנה עם המלצה לשפר את התמונה, כדי שהמוצרים ייראו טוב ללקוח.
*/

// סף רזולוציה — תמונה שהצלע הקטנה שלה מתחת לזה נחשבת "קטנה/לא חדה"
const MIN_GOOD_DIMENSION = 350;

function ProductThumb({ src, alt }) {
  const [lowQuality, setLowQuality] = useState(false);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={(e) => {
          const w = e.target.naturalWidth;
          const h = e.target.naturalHeight;
          if (w && h && Math.min(w, h) < MIN_GOOD_DIMENSION) {
            setLowQuality(true);
          }
        }}
        style={{
          width: 56,
          height: 56,
          objectFit: "cover",
          borderRadius: 8,
          border: "1px solid var(--color-border)",
        }}
      />
      {lowQuality && (
        <span
          title="תמונה קטנה/לא חדה — מומלץ להעלות תמונה גדולה וברורה יותר"
          aria-label="מומלץ לשפר את התמונה"
          style={{
            position: "absolute",
            top: -6,
            insetInlineEnd: -6,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#f39c12",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            cursor: "help",
          }}
        >
          !
        </span>
      )}
    </div>
  );
}

function SupplierHome({ vendor, onGoTo }) {
  const products = (vendor?.products || []).filter((p) => (p.name || "").trim());
  const folders = groupByFolder(products);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-primary-light)",
          marginBottom: 16,
        }}
      >
        <Icon name="package" size={24} />
        <span style={{ fontWeight: 700, fontSize: "var(--font-size-lg)" }}>
          {products.length} מוצרים בכרטיס שלך
        </span>
      </div>

      {folders.length === 0 ? (
        <EmptyState
          icon="📦"
          message="עדיין לא הוספת מוצרים. עברו ל'עריכה' כדי להוסיף את הראשון."
        />
      ) : (
        folders.map((folder) => (
          <div key={folder.name} style={{ marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => onGoTo && onGoTo("products", folder.name)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                width: "100%",
                margin: "0 0 8px",
                padding: 0,
                border: "none",
                background: "none",
                cursor: onGoTo ? "pointer" : "default",
                fontFamily: "var(--font-family)",
                fontSize: "var(--font-size-base)",
                fontWeight: 700,
                color: "var(--color-text)",
                textAlign: "start",
              }}
            >
              <Icon name="folder" size={18} /> {folder.name}
              <span
                style={{
                  color: "var(--color-text-muted)",
                  fontWeight: 400,
                  fontSize: "var(--font-size-sm)",
                }}
              >
                ({folder.products.length})
              </span>
              {onGoTo && (
                <span
                  style={{
                    marginInlineStart: "auto",
                    color: "var(--color-link)",
                    fontWeight: 700,
                    fontSize: "var(--font-size-sm)",
                  }}
                >
                  לעריכה »
                </span>
              )}
            </button>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {folder.products.map((product, index) => (
                <li
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  {product.imageUrl ? (
                    <ProductThumb src={product.imageUrl} alt={product.name} />
                  ) : (
                    <span
                      title="אין תמונה — מומלץ להוסיף"
                      style={{
                        flexShrink: 0,
                        width: 56,
                        height: 56,
                        borderRadius: 8,
                        border: "1px dashed var(--color-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      <Icon name="image" size={22} />
                    </span>
                  )}
                  <span style={{ flex: 1, minWidth: 0, fontWeight: 500 }}>
                    {product.name}
                  </span>
                  <span
                    style={{
                      flexShrink: 0,
                      fontWeight: 700,
                      color: "var(--color-primary-dark)",
                    }}
                  >
                    {formatShekels(product.price)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

export default SupplierHome;
