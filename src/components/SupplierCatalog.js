import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import ProBadge from "./ProBadge";
import Button from "./Button";
import VendorPanel from "../pages/gifts/VendorPanel";
import { getSupplierCatalog } from "../services/vendorsService";
import "../styles/supplier-app.css";

/*
  SupplierCatalog — צפייה בכל הספקים הרשומים במערכת, **כולל המוצרים והמחירים**
  (בדיוק כפי שהוועדים רואים אותם, לקריאה בלבד). **פיצ'ר פרו**: ספק ללא פרו רואה
  הזמנה לשדרג. הרשימה נטענת מ-endpoint שמאמת פרו בשרת (403 לספק ללא פרו).
*/
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
      <div className="sup-catalog__vendors">
        {vendors.map((v) => (
          <VendorPanel key={v.id} vendor={v} readOnly />
        ))}
      </div>
    </div>
  );
}

export default SupplierCatalog;
