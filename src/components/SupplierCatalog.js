import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import ProBadge from "./ProBadge";
import Button from "./Button";
import { getSupplierCatalog } from "../services/vendorsService";
import { whatsappUrlWithText } from "../services/whatsapp";
import "../styles/supplier-app.css";

/*
  SupplierCatalog — צפייה בכל הספקים הרשומים במערכת. **פיצ'ר פרו**: ספק ללא פרו
  רואה הזמנה לשדרג, וספק עם פרו רואה רשימה קומפקטית (שם, קטגוריה, וואטסאפ).
  הרשימה נטענת מ-endpoint שמאמת פרו בשרת (403 לספק ללא פרו).
*/
function initials(name) {
  const w = (name || "").trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "ספ";
}

function SupplierCatalog({ token, isPro, onUpgrade }) {
  const [vendors, setVendors] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPro) {
      return;
    }
    let cancelled = false;
    getSupplierCatalog(token)
      .then((list) => {
        if (!cancelled) setVendors(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "לא הצלחנו לטעון את רשימת הספקים");
      });
    return () => {
      cancelled = true;
    };
  }, [token, isPro]);

  if (!isPro) {
    return (
      <div className="sup-catalog-locked">
        <p className="sup-catalog-locked__title">
          צפייה בכל הספקים במערכת <ProBadge title="פיצ'ר פרו" isPro={false} />
        </p>
        <p className="sup-catalog-locked__text">
          עם פרו אפשר לראות את כל הספקים שרשומים ל-VaddyGo — להתרשם, להשוות
          ולהתחבר. פותחים את זה עכשיו ללא עלות עד 1.1.2027.
        </p>
        {onUpgrade && <Button onClick={onUpgrade}>שדרוג לפרו</Button>}
      </div>
    );
  }

  if (error) {
    return (
      <p className="field__error" role="alert">
        {error}
      </p>
    );
  }
  if (!vendors) {
    return <Spinner text="טוען את רשימת הספקים..." />;
  }

  return (
    <div className="sup-catalog">
      <p className="sup-catalog__count">{vendors.length} ספקים רשומים במערכת</p>
      <ul className="sup-catalog__list">
        {vendors.map((v) => (
          <li key={v.id} className="sup-catalog__card">
            <span className="sup-catalog__avatar" aria-hidden="true">
              {initials(v.name)}
            </span>
            <span className="sup-catalog__info">
              <span className="sup-catalog__name">{v.name || "ספק"}</span>
              {v.category && (
                <span className="sup-catalog__cat">{v.category}</span>
              )}
            </span>
            {v.whatsApp && (
              <a
                className="sup-catalog__wa"
                href={whatsappUrlWithText(v.whatsApp, "")}
                target="_blank"
                rel="noreferrer"
              >
                וואטסאפ
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SupplierCatalog;
