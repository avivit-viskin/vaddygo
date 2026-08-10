import { useState } from "react";
import Button from "./Button";
import Icon from "./Icon";
import BrandName from "./BrandName";
import { whatsappUrlWithText } from "../services/whatsapp";
import { startVendorProCheckout } from "../services/vendorsService";
import "../styles/pro.css";
import "../styles/upgrade-extras.css";

/*
  SupplierUpgrade — מסך "שדרוגי פרו" לספק, במקביל לעמוד השדרוג של הוועד
  (UpgradePage) ובאותו עיצוב. מציג את יכולות הפרו של הספק, המחיר, וכפתור פנייה
  למנהלת VaddyGo לפתיחת המסלול (ספקים נפתחים ידנית ע"י VaddyGo — לא בתשלום עצמי).
  אם הספק כבר פרו — מציג חיווי שהמסלול פעיל.
*/
const SUPPLIER_PRO_PRICE = 1200; // ₪ לשנה (תואם למסמך התמחור)
const SUPPORT_PHONE = "054-4579179";

// יכולות הפרו של הספק — תואם למה שנעול היום ב-vendor.isPro בפורטל הספקים.
const SUPPLIER_PRO_FEATURES = [
  {
    icon: "message",
    label: "תיבת פניות מוועדים",
    desc: "בקשות הצעת מחיר מוועדים מגיעות אליך, עם ניהול סטטוס ומענה מהיר בוואטסאפ.",
  },
  {
    icon: "chart",
    label: "דוחות הספק",
    desc: "צפיות, פניות ופילוח המוצרים שלך לפי קטגוריה — להבין מה עובד.",
  },
  {
    icon: "tag",
    label: "מבצע / הצעה מיוחדת",
    desc: "הצעה בולטת שמופיעה לוועדים בכרטיס שלך ובקטלוג — הנעה לרכישה.",
  },
  {
    icon: "link",
    label: "רשתות חברתיות בכרטיס",
    desc: "קישורים לרשתות שלך ישירות בכרטיס שהוועדים רואים.",
  },
  {
    icon: "image",
    label: "שיתוף קטלוג ממותג",
    desc: "קישור קטלוג יפה וממותג לשיתוף בכל מקום.",
  },
  {
    icon: "message",
    label: "תמיכה מועדפת",
    desc: "מענה מהיר ואישי לכל שאלה, ישירות בוואטסאפ.",
  },
];

function SupplierUpgrade({ vendor, token }) {
  const alreadyPro = !!vendor?.isPro;
  // תשלום מקוון מוצג רק כשמחוברת סליקה אמיתית (השרת מחליט) — אחרת חוזרים
  // לפתיחה בתיאום אישי, כדי שספק לא יגיע לעמוד תשלום שאינו גובה.
  const canPayOnline = !!vendor?.proCheckoutAvailable;
  const [isStarting, setIsStarting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  /*
    פותח תשלום בשרת ומעביר את הספק לעמוד המאובטח של חברת הסליקה. אנחנו לא
    נוגעים בפרטי הכרטיס, והמסלול נפתח רק כשחברת הסליקה מאשרת לשרת שלנו.
  */
  async function startCheckout() {
    setIsStarting(true);
    setCheckoutError("");
    try {
      const paymentUrl = await startVendorProCheckout(token);
      window.location.href = paymentUrl;
    } catch (err) {
      setCheckoutError(
        err.message || "לא הצלחנו לפתוח את עמוד התשלום. אפשר לנסות שוב."
      );
      setIsStarting(false);
    }
  }
  const contactUrl = whatsappUrlWithText(
    SUPPORT_PHONE,
    `היי, אשמח לשדרג את הכרטיס שלי (${
      vendor?.name || "ספק"
    }) ב-VaddyGo למסלול פרו`
  );

  // כבר פרו — לא מציגים מחיר/פיצ'רים, רק אישור שהמסלול נרכש והכול מוכן.
  if (alreadyPro) {
    return (
      <div className="upgrade-page">
        <div className="upgrade-hero">
          <span className="upgrade-crown">
            <Icon name="check-circle" size={40} title="פרו פעיל" />
          </span>
          <h2 className="upgrade-title">מסלול פרו נרכש בהצלחה</h2>
          <p className="upgrade-subtitle">
            כל הפיצ'רים מוכנים ופעילים בכרטיס שלך — אפשר להתחיל לעבוד ולקבל יותר
            הזמנות מהוועדים.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="upgrade-page">
      <div className="upgrade-hero">
        <h2 className="upgrade-title">
          שדרוגי <BrandName /> פרו
        </h2>
        <p className="upgrade-price">
          <span className="upgrade-price__num">
            ₪{SUPPLIER_PRO_PRICE.toLocaleString("he-IL")}
          </span>
          <span className="upgrade-price__per"> / שנה</span>
        </p>
        <p className="upgrade-subtitle">
          כל מה שיש בחינם — ובנוסף הכלים שמביאים לך יותר הזמנות מוועדים:
        </p>
      </div>

      <div className="upgrade-more">
        <ul className="upgrade-more__list">
          {SUPPLIER_PRO_FEATURES.map((f) => (
            <li key={f.label} className="upgrade-more__item">
              <span className="upgrade-more__icon">
                <Icon name={f.icon} size={20} />
              </span>
              <span className="upgrade-more__body">
                <span className="upgrade-more__label">{f.label}</span>
                <span className="upgrade-more__desc">{f.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/*
        כפתור הרכישה מוצג **תמיד** — הספק צריך לראות איך קונים.
        מה שמשתנה הוא איך הרכישה מושלמת:
        • יש סליקה מחוברת → עמוד תשלום מאובטח של חברת הסליקה.
        • אין סליקה (המצב היום) → פנייה בוואטסאפ שמשלימה את הרכישה מולנו.
        לעולם לא שולחים ספק לעמוד תשלום שאינו גובה באמת.
      */}
      <div className="upgrade-actions">
        <p className="upgrade-note">
          <Icon name={canPayOnline ? "lock" : "message"} size={15} />
          <span>
            {canPayOnline
              ? "התשלום מתבצע בעמוד מאובטח של חברת הסליקה — פרטי הכרטיס אינם עוברים דרך VaddyGo ואינם נשמרים אצלנו."
              : "משאירים לנו הודעה קצרה בוואטסאפ, ואנחנו פותחים לך את המסלול ומסדירים איתך את התשלום."}
          </span>
        </p>

        {canPayOnline ? (
          <Button variant="brand" onClick={startCheckout} isLoading={isStarting}>
            <Icon name="card" size={16} /> רכישת מסלול פרו — תשלום מאובטח
          </Button>
        ) : (
          <a href={contactUrl} target="_blank" rel="noreferrer">
            <Button variant="brand">
              <Icon name="message" size={16} /> רכישת מסלול פרו
            </Button>
          </a>
        )}

        {checkoutError && (
          <p className="field__error" role="alert">
            {checkoutError}
          </p>
        )}

        {canPayOnline && (
          <>
            <p className="upgrade-note">
              <Icon name="message" size={15} />
              <span>מעדיפים לדבר קודם? נשמח לעזור בוואטסאפ 🙂</span>
            </p>
            <a href={contactUrl} target="_blank" rel="noreferrer">
              <Button variant="secondary">
                <Icon name="message" size={16} /> דברו איתנו
              </Button>
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default SupplierUpgrade;
