import { useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { getPublicCatalog } from "../services/vendorsService";
import { groupByFolder } from "../services/vendorFolders";
import { formatShekels } from "../services/format";
import { whatsappUrlWithText } from "../services/whatsapp";
import Logo from "../components/Logo";
import Icon from "../components/Icon";
import WhatsAppIcon from "../components/WhatsAppIcon";
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
  const fetcher = useCallback(() => getPublicCatalog(id), [id]);
  const { data: vendor, isLoading, error, reload } = useApi(fetcher);

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

  const folders = groupByFolder(vendor.products || []);
  const wa = vendor.whatsApp
    ? whatsappUrlWithText(vendor.whatsApp, "היי! ראיתי את הקטלוג שלכם 🙂")
    : null;

  return (
    <div className="pub" dir="rtl">
      <header className="pub-hero">
        <div className="pub-hero__logo">
          <Logo />
        </div>
        <h1 className="pub-hero__name">{vendor.name}</h1>
        {(vendor.category || vendor.city) && (
          <p className="pub-hero__meta">
            {vendor.category}
            {vendor.category && vendor.city ? " · " : ""}
            {vendor.city}
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
              📖 קטלוג מלא
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
                      alt={product.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="pub-card__img pub-card__img--empty">
                      <Icon name="image" size={26} />
                    </div>
                  )}
                  <div className="pub-card__body">
                    <span className="pub-card__name">{product.name}</span>
                    <span className="pub-card__price">
                      {formatShekels(product.price)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      <p className="pub-foot">
        הקטלוג מוצג באמצעות{" "}
        <Link to="/suppliers">VaddyGo</Link> — ניהול ועדי הורים
      </p>
    </div>
  );
}

export default CatalogPage;
