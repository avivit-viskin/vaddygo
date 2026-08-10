import Button from "./Button";
import Icon from "./Icon";
import BrandName from "./BrandName";
import { SUPPLIER_PRO_PAYMENT_URL } from "../config/payment";
import "../styles/pro.css";
import "../styles/upgrade-extras.css";

/*
  SupplierUpgrade — מסך "שדרוגי פרו" לספק, במקביל לעמוד השדרוג של הוועד
  (UpgradePage) ובאותו עיצוב. מציג את יכולות הפרו של הספק, המחיר, וכפתור פנייה
  למנהלת VaddyGo לפתיחת המסלול (ספקים נפתחים ידנית ע"י VaddyGo — לא בתשלום עצמי).
  אם הספק כבר פרו — מציג חיווי שהמסלול פעיל.
*/
const SUPPLIER_PRO_PRICE = 1200; // ₪ לשנה (תואם למסמך התמחור)

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

function SupplierUpgrade({ vendor }) {
  const alreadyPro = !!vendor?.isPro;
  /*
    הרכישה מתבצעת בעמוד תשלום של **GROW** (החלטת בעלת המוצר, 10.08.2026) —
    לא בוואטסאפ ולא בתוך המערכת. אנחנו רק מפנים לשם; פרטי הכרטיס אינם עוברים
    דרך VaddyGo ואינם נשמרים אצלנו.

    כל עוד לא הוגדר קישור (ראו config/payment.js) הכפתור אינו מוצג — עדיף
    שלא תהיה רכישה מאשר כפתור שמוביל לשום מקום או לעמוד תשלום שגוי.
  */
  const paymentUrl = SUPPLIER_PRO_PAYMENT_URL;
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
        <span className="upgrade-crown">
          <Icon name="crown" size={40} title="פרו" />
        </span>
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

      <div className="upgrade-actions">
        <p className="upgrade-note">
          <Icon name="lock" size={15} />
          <span>
            התשלום מתבצע בעמוד מאובטח של GROW — פרטי הכרטיס אינם עוברים דרך
            VaddyGo ואינם נשמרים אצלנו. המסלול נפתח מיד לאחר אישור התשלום.
          </span>
        </p>

        {paymentUrl ? (
          <a href={paymentUrl} target="_blank" rel="noreferrer">
            <Button variant="brand">
              <Icon name="card" size={16} /> רכישת מסלול פרו
            </Button>
          </a>
        ) : (
          /* בלי קישור תשלום מוגדר אין מה ללחוץ — מסבירים במקום להוביל לשומקום */
          <p className="upgrade-note">
            <Icon name="clock" size={15} />
            <span>הרכישה המקוונת תיפתח כאן בקרוב.</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default SupplierUpgrade;
