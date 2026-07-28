import { useState } from "react";
import EmptyState from "./EmptyState";
import Icon from "./Icon";
import { formatShekels } from "../services/format";
import { groupByFolder } from "../services/vendorFolders";
import "../styles/supplier-app.css";

/*
  SupplierHome — דאשבורד הספק: אריחי מדדים (מוצרים, מוכנים, דורש טיפול, צפיות)
  ומתחת המוצרים ככרטיסים, מקובצים בתיקיות, עם סטטוס וכפתור עריכה. ליד תמונה
  ברזולוציה נמוכה מוצג סימן קטן. לחיצה על תיקייה/עריכה עוברת לדף המוצרים.
*/
const MIN_GOOD_DIMENSION = 350;

function isMissing(p) {
  return !(Number(p.price) > 0) || !(p.imageUrl || "").trim();
}

function ProductCardImage({ src, alt }) {
  const [lowQuality, setLowQuality] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <img
        className="sup-prod__img"
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
      />
      {lowQuality && (
        <span
          title="תמונה קטנה/לא חדה — מומלץ תמונה גדולה וברורה יותר"
          style={{
            position: "absolute",
            top: 6,
            insetInlineEnd: 6,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#f39c12",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
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
  const ready = products.filter((p) => !isMissing(p));
  const needsAttention = products.filter((p) => isMissing(p));
  const views = vendor?.views || 0;
  const folders = groupByFolder(products);

  const goToProducts = (folder) => onGoTo && onGoTo("products", folder);

  return (
    <div>
      {/* דאשבורד */}
      <div className="sup-stats">
        <div className="sup-stat">
          <div className="sup-stat__icon">📦</div>
          <div className="sup-stat__num">{products.length}</div>
          <div className="sup-stat__label">מוצרים</div>
        </div>
        <div className="sup-stat">
          <div className="sup-stat__icon">✅</div>
          <div className="sup-stat__num">{ready.length}</div>
          <div className="sup-stat__label">מוכנים</div>
        </div>
        <div
          className={`sup-stat${needsAttention.length ? " sup-stat--warn" : ""}`}
        >
          <div className="sup-stat__icon">⚠️</div>
          <div className="sup-stat__num">{needsAttention.length}</div>
          <div className="sup-stat__label">דורש טיפול</div>
        </div>
        <div className="sup-stat">
          <div className="sup-stat__icon">👀</div>
          <div className="sup-stat__num">{views}</div>
          <div className="sup-stat__label">צפיות</div>
        </div>
      </div>

      {folders.length === 0 ? (
        <EmptyState
          icon="📦"
          message="עדיין אין מוצרים. עברו ל'מוצרים' כדי להוסיף את הראשון."
        />
      ) : (
        folders.map((folder) => (
          <div key={folder.name} style={{ marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => goToProducts(folder.name)}
              className="sup-section-title"
              style={{
                width: "100%",
                border: "none",
                background: "none",
                cursor: onGoTo ? "pointer" : "default",
                fontFamily: "var(--font-family)",
                textAlign: "start",
                fontSize: "var(--font-size-base)",
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
            <div className="sup-prods">
              {folder.products.map((product, i) => {
                const missing = isMissing(product);
                return (
                  <article key={i} className="sup-prod">
                    {product.imageUrl ? (
                      <ProductCardImage
                        src={product.imageUrl}
                        alt={product.name}
                      />
                    ) : (
                      <div className="sup-prod__img sup-prod__img--empty">
                        <Icon name="image" size={28} />
                      </div>
                    )}
                    <div className="sup-prod__body">
                      <span className="sup-prod__name">{product.name}</span>
                      <span className="sup-prod__price">
                        {formatShekels(product.price)}
                      </span>
                      <span
                        className={`sup-prod__status ${
                          missing
                            ? "sup-prod__status--warn"
                            : "sup-prod__status--ok"
                        }`}
                      >
                        {missing ? "⚠️ חסר מידע" : "✔️ זמין"}
                      </span>
                      <button
                        type="button"
                        className="sup-prod__edit"
                        onClick={() => goToProducts(folder.name)}
                      >
                        ✏️ ערוך מוצר
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default SupplierHome;
