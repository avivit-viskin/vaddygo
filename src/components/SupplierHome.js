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

// וקטור (SVG) — חד בכל גודל, ולכן לא נבדק לרזולוציה נמוכה (naturalWidth שלו לא אמין)
const isVectorSrc = (s) => /^data:image\/svg|\.svg(\?|#|$)/i.test(s || "");

function ProductCardImage({ src, alt, onLowRes, onBadgeClick }) {
  const [lowQuality, setLowQuality] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <img
        className="sup-prod__img"
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={(e) => {
          if (isVectorSrc(src)) return;
          const w = e.target.naturalWidth;
          const h = e.target.naturalHeight;
          if (w && h && Math.min(w, h) < MIN_GOOD_DIMENSION) {
            setLowQuality(true);
            onLowRes && onLowRes();
          }
        }}
      />
      {lowQuality && (
        // סימן קריאה לחיץ — פותח הודעת המלצה בגוף הכרטיס (כדי שלא ייחתך)
        <button
          type="button"
          onClick={onBadgeClick}
          aria-label="בעיית איכות תמונה — לחצו לפרטים"
          title="לחצו לפרטים על איכות התמונה"
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
            cursor: "pointer",
            border: "none",
            padding: 0,
          }}
        >
          !
        </button>
      )}
    </div>
  );
}

function SupplierHome({ vendor, onGoTo }) {
  const products = (vendor?.products || []).filter((p) => (p.name || "").trim());
  // srcs של תמונות שזוהו כרזולוציה נמוכה (בטעינה) — נספרות גם הן כ"דורש טיפול"
  const [lowResSrcs, setLowResSrcs] = useState(() => new Set());
  const markLowRes = (src) =>
    setLowResSrcs((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
  const isLowRes = (p) => !!(p.imageUrl && lowResSrcs.has(p.imageUrl));
  // איזו תמונה מציגה כרגע את הודעת ההמלצה (בלחיצה על ה-!); null = אין
  const [openMsgSrc, setOpenMsgSrc] = useState(null);
  // מפתחות מוצרים שהתיאור שלהם מורחב ("קרא עוד"); ברירת מחדל — מקוצר ל-2 שורות
  const [expandedDesc, setExpandedDesc] = useState(() => new Set());
  const toggleDesc = (key) =>
    setExpandedDesc((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const ready = products.filter((p) => !isMissing(p) && !isLowRes(p));
  const needsAttention = products.filter((p) => isMissing(p) || isLowRes(p));
  const views = vendor?.views || 0;
  const folders = groupByFolder(products);

  // תיקיות נפתחות/נסגרות (אקורדיון): התיקייה הראשונה פתוחה כברירת מחדל, השאר
  // מקופלות — כדי לראות רצף של תיקיות ולהגיע בקלות לזו שרוצים.
  const [openFolders, setOpenFolders] = useState(
    () => new Set(folders[0] ? [folders[0].name] : [])
  );
  const toggleFolder = (name) =>
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const goToProducts = (folder) => onGoTo && onGoTo("products", folder);
  // אריח שנלחץ → דף המוצרים מסונן לפי הסטטוס (מוכנים / דורש טיפול / הכל)
  const goToStatus = (status) => onGoTo && onGoTo("products", "", status);

  return (
    <div>
      {/* דאשבורד — אריחים לחיצים: מובילים לדף המוצרים מסונן לפי הסטטוס */}
      <div className="sup-stats">
        <button
          type="button"
          className="sup-stat sup-stat--link"
          onClick={() => goToStatus("")}
        >
          <div className="sup-stat__num">{products.length}</div>
          <div className="sup-stat__label">מוצרים</div>
        </button>
        <button
          type="button"
          className="sup-stat sup-stat--link"
          onClick={() => goToStatus("ready")}
        >
          <div className="sup-stat__num">{ready.length}</div>
          <div className="sup-stat__label">מוכנים</div>
        </button>
        <button
          type="button"
          className={`sup-stat sup-stat--link${
            needsAttention.length ? " sup-stat--warn" : ""
          }`}
          onClick={() => goToStatus("attention")}
        >
          <div className="sup-stat__num">{needsAttention.length}</div>
          <div className="sup-stat__label">דורש טיפול</div>
        </button>
        <div className="sup-stat">
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
        folders.map((folder) => {
          const isOpen = openFolders.has(folder.name);
          return (
          <div key={folder.name} className="sup-folder">
            <div className="sup-folder__head">
              <button
                type="button"
                className="sup-folder__toggle"
                onClick={() => toggleFolder(folder.name)}
                aria-expanded={isOpen}
              >
                <span
                  className={`sup-folder__chevron${
                    isOpen ? " sup-folder__chevron--open" : ""
                  }`}
                  aria-hidden="true"
                >
                  ▾
                </span>
                <Icon name="folder" size={18} />
                <span className="sup-folder__name">{folder.name}</span>
                <span className="sup-folder__count">
                  ({folder.products.length})
                </span>
              </button>
              {onGoTo && (
                <button
                  type="button"
                  className="sup-folder__edit"
                  onClick={() => goToProducts(folder.name)}
                >
                  לעריכה »
                </button>
              )}
            </div>
            {isOpen && (
            <div className="sup-prods">
              {folder.products.map((product, i) => {
                const missing = isMissing(product);
                const lowRes = isLowRes(product);
                return (
                  <article key={i} className="sup-prod">
                    {product.imageUrl ? (
                      <ProductCardImage
                        src={product.imageUrl}
                        alt={product.name}
                        onLowRes={() => markLowRes(product.imageUrl)}
                        onBadgeClick={() =>
                          setOpenMsgSrc((s) =>
                            s === product.imageUrl ? null : product.imageUrl
                          )
                        }
                      />
                    ) : (
                      <div className="sup-prod__img sup-prod__img--empty">
                        <Icon name="image" size={28} />
                      </div>
                    )}
                    <div className="sup-prod__body">
                      <span className="sup-prod__name">{product.name}</span>
                      {product.description && (
                        <>
                          {/* תיאור — מקוצר ל-2 שורות כדי לשמור על גובה אחיד;
                              "קרא עוד" מרחיב אם התיאור ארוך */}
                          <span
                            className="sup-prod__desc"
                            style={{
                              fontSize: 12,
                              lineHeight: 1.35,
                              color: "var(--color-text-muted)",
                              ...(expandedDesc.has(product.id ?? product.name)
                                ? {}
                                : {
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }),
                            }}
                          >
                            {product.description}
                          </span>
                          {product.description.length > 55 && (
                            <button
                              type="button"
                              onClick={() =>
                                toggleDesc(product.id ?? product.name)
                              }
                              style={{
                                alignSelf: "flex-start",
                                border: "none",
                                background: "none",
                                padding: 0,
                                color: "var(--color-link)",
                                fontFamily: "var(--font-family)",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              {expandedDesc.has(product.id ?? product.name)
                                ? "קרא פחות"
                                : "קרא עוד ..."}
                            </button>
                          )}
                        </>
                      )}
                      <span className="sup-prod__price">
                        {formatShekels(product.price)}
                      </span>
                      <span
                        className={`sup-prod__status ${
                          missing || lowRes
                            ? "sup-prod__status--warn"
                            : "sup-prod__status--ok"
                        }`}
                      >
                        {missing
                          ? "⚠️ חסר מידע"
                          : lowRes
                          ? "⚠️ רזולוציה נמוכה"
                          : "✔️ זמין"}
                      </span>
                      {/* הודעת ההמלצה — זורמת בתוך הכרטיס כדי שלא תיחתך */}
                      {lowRes && openMsgSrc === product.imageUrl && (
                        <span
                          role="status"
                          style={{
                            marginTop: 4,
                            fontSize: 12,
                            lineHeight: 1.4,
                            color: "#a15c00",
                            background: "#fef3e2",
                            border: "1px solid #f6d9a8",
                            borderRadius: 8,
                            padding: "6px 8px",
                          }}
                        >
                          התמונה ברזולוציה לא טובה. ההמלצה: תמונה בגודל{" "}
                          <strong>600×600</strong> לפחות.
                        </span>
                      )}
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
            )}
          </div>
          );
        })
      )}
    </div>
  );
}

export default SupplierHome;
