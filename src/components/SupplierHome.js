import { useState } from "react";
import EmptyState from "./EmptyState";
import Icon from "./Icon";
import { formatShekels } from "../services/format";
import { groupByFolder } from "../services/vendorFolders";
import { withDisplayNames } from "../services/vendorProducts";
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
            background: "var(--color-attention)",
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

function SupplierHome({ vendor, onGoTo, onShareCatalog }) {
  // מוצר בלי שם תקף לגמרי — הוא מוצג כ"מוצר N" לפי מקומו ברשימת הספק
  const products = withDisplayNames(vendor?.products || []);
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
  const leads = vendor?.leads || 0;
  const folders = groupByFolder(products);

  // תיקיות נפתחות/נסגרות (אקורדיון): כולן סגורות כברירת מחדל — רואים רצף נקי של
  // כותרות התיקיות ופותחים בלחיצה את זו שרוצים.
  const [openFolders, setOpenFolders] = useState(() => new Set());
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
        <div className="sup-stat">
          <div className="sup-stat__num">{leads}</div>
          <div className="sup-stat__label">פניות</div>
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
            <>
              {/* קישור לקטלוג של התיקייה — רק אם יש בה מוצרים (תמיד כן כאן) */}
              {onShareCatalog && folder.products.length > 0 && (
                <div className="sup-folder__actions">
                  <button
                    type="button"
                    className="sup-folder__catalog"
                    onClick={() => onShareCatalog(folder.name)}
                  >
                    <Icon name="link" size={16} /> קישור לקטלוג של התיקייה
                  </button>
                </div>
              )}
            <div className="sup-prods">
              {folder.products.map((product, i) => {
                const missing = isMissing(product);
                const lowRes = isLowRes(product);
                return (
                  <article key={i} className="sup-prod">
                    {product.imageUrl ? (
                      <ProductCardImage
                        src={product.imageUrl}
                        alt={product.displayName}
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
                      <span className="sup-prod__name">
                        {product.displayName}
                      </span>
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
                              ...(expandedDesc.has(product.id ?? product.displayName)
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
                                toggleDesc(product.id ?? product.displayName)
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
                              {expandedDesc.has(product.id ?? product.displayName)
                                ? "קרא פחות"
                                : "קרא עוד ..."}
                            </button>
                          )}
                        </>
                      )}
                      <span className="sup-prod__price">
                        {formatShekels(product.price)}
                        {product.unit ? ` ל-${product.unit}` : ""}
                      </span>
                      <span
                        className={`sup-prod__status ${
                          missing || lowRes
                            ? "sup-prod__status--warn"
                            : "sup-prod__status--ok"
                        }`}
                      >
                        {missing ? (
                          <>
                            <Icon name="warning" size={13} /> חסר מידע
                          </>
                        ) : lowRes ? (
                          <>
                            <Icon name="warning" size={13} /> רזולוציה נמוכה
                          </>
                        ) : (
                          <>
                            <Icon name="check-circle" size={13} /> זמין
                          </>
                        )}
                      </span>
                      {/* הודעת ההמלצה — זורמת בתוך הכרטיס כדי שלא תיחתך */}
                      {lowRes && openMsgSrc === product.imageUrl && (
                        <span
                          role="status"
                          style={{
                            marginTop: 4,
                            fontSize: 12,
                            lineHeight: 1.4,
                            color: "var(--color-attention)",
                            background: "var(--color-warning)",
                            border: "1px solid var(--color-attention)",
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
                        <Icon name="pencil" size={14} /> ערוך מוצר
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            </>
            )}
          </div>
          );
        })
      )}
    </div>
  );
}

export default SupplierHome;
