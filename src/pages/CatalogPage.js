import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { getPublicCatalog } from "../services/vendorsService";
import { getVendorReviews } from "../services/reviewsService";
import { groupByFolder } from "../services/vendorFolders";
import { withDisplayNames } from "../services/vendorProducts";
import { formatShekels, formatUnit } from "../services/format";
import { whatsappUrlWithText } from "../services/whatsapp";
import { isTopRated } from "../services/vendorReputation";
import Icon from "../components/Icon";
import KosherBadge from "../components/KosherBadge";
import WhatsAppIcon from "../components/WhatsAppIcon";
import StarRating from "../components/StarRating";
import VendorReviews from "../components/VendorReviews";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import "../styles/supplier-public.css";

/*
  CatalogPage — קטלוג ציבורי לקריאה בלבד של ספק (/catalog/:id), לשיתוף עם כל
  אחד. "מיני-אתר" ממותג: שם הספק, קטגוריה/עיר, מוצרים לפי תיקיות עם תמונות
  ומחירים, וכפתורי יצירת קשר (וואטסאפ/רשתות). בלי פרטי תשלום/עריכה.
*/
function CatalogPage() {
  const { id } = useParams();
  // קישור לתיקייה בודדת: /catalog/:id?folder=<שם התיקייה> — מציג רק אותה כקטלוג
  const [searchParams] = useSearchParams();
  const folderParam = (searchParams.get("folder") || "").trim();
  const fetcher = useCallback(() => getPublicCatalog(id), [id]);
  const { data: vendor, isLoading, error, reload } = useApi(fetcher);
  // מוניטין הספק — נגזר מהביקורות (הקטלוג הציבורי אינו מחזיר ממוצע, ולכן
  // מחשבים כאן מרשימת הביקורות הציבורית). מוצג בכותרת כהוכחה חברתית.
  const [rep, setRep] = useState({ average: 0, count: 0 });
  useEffect(() => {
    let cancelled = false;
    getVendorReviews(id)
      .then((list) => {
        if (cancelled || !Array.isArray(list) || list.length === 0) return;
        const sum = list.reduce((s, r) => s + (Number(r.stars) || 0), 0);
        setRep({
          average: Math.round((sum / list.length) * 10) / 10,
          count: list.length,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);
  // תמונת מוצר להגדלה (לייטבוקס); null = סגור
  const [zoomImage, setZoomImage] = useState(null);
  // מפתחות מוצרים שהתיאור שלהם מורחב ("קרא עוד"); ברירת מחדל — מקוצר ל-2 שורות
  const [expandedDesc, setExpandedDesc] = useState(() => new Set());
  const toggleDesc = (key) =>
    setExpandedDesc((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (isLoading) {
    return <Spinner text="טוען קטלוג..." />;
  }
  if (error) {
    return (
      <div className="pub" dir="rtl">
        <ErrorMessage message="הקטלוג לא נמצא או שאינו זמין." onRetry={reload} />
      </div>
    );
  }

  // מוצר בלי שם מוצג כ"מוצר N" לפי מקומו ברשימת הספק (ולא נעלם מהקטלוג)
  const allFolders = groupByFolder(withDisplayNames(vendor.products || []));
  // אם הגיעו עם קישור לתיקייה מסוימת — מציגים רק אותה (קטלוג של תיקייה אחת)
  const folders =
    folderParam && allFolders.some((f) => f.name === folderParam)
      ? allFolders.filter((f) => f.name === folderParam)
      : allFolders;
  const wa = vendor.whatsApp
    ? whatsappUrlWithText(vendor.whatsApp, "היי! ראיתי את הקטלוג שלכם 🙂")
    : null;
  // זהות הספק בכותרת — תמונת המוצר הראשונה כאווטאר, אחרת מונוגרם (אות ראשונה).
  // כך הכרטיס הוא של הספק, לא של VaddyGo (המותג של VaddyGo נשאר בפוטר בלבד).
  const avatarImg = (vendor.products || []).find((p) => p.imageUrl)?.imageUrl;
  const monogram = (vendor.name || "?").trim().charAt(0) || "?";

  return (
    <div className="pub" dir="rtl">
      <header className="pub-hero">
        <div className="pub-hero__avatar" aria-hidden="true">
          {avatarImg ? (
            <img src={avatarImg} alt="" loading="lazy" />
          ) : (
            <span>{monogram}</span>
          )}
        </div>
        <h1 className="pub-hero__name">
          {vendor.name}
          {vendor.isKosher && <> <KosherBadge /></>}
        </h1>
        {(vendor.category || vendor.city) && (
          <p className="pub-hero__meta">
            {vendor.category}
            {vendor.category && vendor.city ? " · " : ""}
            {vendor.city}
          </p>
        )}
        {folderParam && folders.length > 0 && (
          <p className="pub-hero__meta">
            <Icon name="folder" size={15} /> קטלוג: {folderParam}
          </p>
        )}
        {/* מוניטין — כוכבים + תג "ספק מצטיין" (הוכחה חברתית בראש הכרטיס) */}
        {rep.count > 0 && (
          <div className="pub-hero__rating">
            <StarRating value={rep.average} size={17} />
            <span className="pub-hero__rating-num">{rep.average}</span>
            <span className="pub-hero__rating-count">
              ({rep.count} ביקורות)
            </span>
            {isTopRated({ averageRating: rep.average, reviewCount: rep.count }) && (
              <span className="pub-hero__top-rated">🏆 ספק מצטיין</span>
            )}
          </div>
        )}
        {/* מבצע — הנעה לרכישה, בולט כמו בכרטיס שהוועד רואה */}
        {vendor.offer && (
          <p className="pub-offer">
            <Icon name="tag" size={15} /> {vendor.offer}
          </p>
        )}
        <div className="pub-hero__contacts">
          {wa && (
            <a className="pub-btn pub-btn--wa" href={wa} target="_blank" rel="noreferrer">
              <WhatsAppIcon color="#fff" size={18} /> וואטסאפ
            </a>
          )}
          {vendor.catalogUrl && (
            <a
              className="pub-btn"
              href={vendor.catalogUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="link" size={16} /> קטלוג מלא
            </a>
          )}
          {(vendor.socialLinks || []).map((link, i) => (
            <a
              key={i}
              className="pub-btn"
              href={link.url}
              target="_blank"
              rel="noreferrer"
            >
              {link.label || "קישור"}
            </a>
          ))}
        </div>
      </header>

      {folders.length === 0 ? (
        <p className="pub-sub">עדיין אין מוצרים בקטלוג הזה.</p>
      ) : (
        folders.map((folder) => (
          <section key={folder.name} className="pub-folder">
            <h2 className="pub-folder__title">
              <Icon name="folder" size={18} /> {folder.name}
            </h2>
            <div className="pub-grid">
              {folder.products.map((product, i) => (
                <article key={i} className="pub-card">
                  {product.imageUrl ? (
                    <img
                      className="pub-card__img"
                      src={product.imageUrl}
                      alt={product.displayName}
                      loading="lazy"
                      onClick={() => setZoomImage(product.imageUrl)}
                      style={{ cursor: "zoom-in" }}
                    />
                  ) : (
                    <div className="pub-card__img pub-card__img--empty">
                      <Icon name="image" size={26} />
                    </div>
                  )}
                  <div className="pub-card__body">
                    <span className="pub-card__name">
                      {product.displayName}
                    </span>
                    {product.description && (
                      <>
                        {/* תיאור מקוצר ל-2 שורות (כרטיסים אחידים); "קרא עוד" מרחיב */}
                        <span
                          className="pub-card__desc"
                          style={
                            expandedDesc.has(`${folder.name}:${i}`)
                              ? undefined
                              : {
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }
                          }
                        >
                          {product.description}
                        </span>
                        {product.description.length > 55 && (
                          <button
                            type="button"
                            onClick={() => toggleDesc(`${folder.name}:${i}`)}
                            style={{
                              alignSelf: "flex-start",
                              border: "none",
                              background: "none",
                              padding: 0,
                              marginTop: 2,
                              color: "var(--color-primary-dark)",
                              fontFamily: "var(--font-family)",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {expandedDesc.has(`${folder.name}:${i}`)
                              ? "קרא פחות"
                              : "קרא עוד ..."}
                          </button>
                        )}
                      </>
                    )}
                    <span className="pub-card__price">
                      {formatShekels(product.price)}
                      {formatUnit(product.unit) ? ` ל-${formatUnit(product.unit)}` : ""}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      {/* ביקורות ודירוג — קריאה בלבד (מבקר בקטלוג הציבורי אינו מדרג; דירוג
          נכתב רק בתוך המערכת ע"י ועד מחובר). מוסיף אמון למי ששוקל לפנות. */}
      {rep.count > 0 && (
        <section className="pub-reviews">
          <h2 className="pub-folder__title">
            <Icon name="star" size={18} /> ביקורות ודירוג
          </h2>
          <VendorReviews
            vendorId={id}
            average={rep.average}
            count={rep.count}
            readOnly
          />
        </section>
      )}

      <p className="pub-foot">
        הקטלוג מוצג באמצעות{" "}
        <Link to="/suppliers">VaddyGo</Link> — ניהול ועדי הורים
      </p>

      {/* כפתור וואטסאפ צף — תמיד נגיש בזמן גלילה בקטלוג, ליצירת קשר מיידית */}
      {wa && (
        <a
          className="pub-wa-fab"
          href={wa}
          target="_blank"
          rel="noreferrer"
          aria-label="שליחת וואטסאפ"
          title="וואטסאפ"
        >
          <WhatsAppIcon color="#fff" size={30} />
        </a>
      )}

      {/* הגדלת תמונת מוצר (לייטבוקס) — לחיצה בכל מקום או על ה-✕ סוגרת */}
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

export default CatalogPage;
