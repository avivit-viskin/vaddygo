import "../styles/supplier-public.css";

/*
  SupplierProPromo — הודעת המבצע בכניסת/הרשמת הספקים: מסלול הפרו פתוח לספקים
  ללא עלות עד 1.1.2027 (החלטת בעלת המוצר 17.09.2026). התאריך תואם ל-
  VendorProPolicy.PromoFreeProUntil בשרת — אם משנים שם, לעדכן גם כאן.
*/
function SupplierProPromo() {
  return (
    <div className="supplier-promo" role="note">
      <span className="supplier-promo__spark" aria-hidden="true">
        🎉
      </span>
      <span>
        מסלול הפרו פתוח לכל הספקים <strong>בחינם עד 1.1.2027</strong> — כל
        הפניות מהוועדים, מבצע מיוחד בכרטיס ודוחות צפייה.
      </span>
    </div>
  );
}

export default SupplierProPromo;
