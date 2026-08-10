import Button from "./Button";
import Icon from "./Icon";
import BrandName from "./BrandName";
import { whatsappUrlWithText } from "../services/whatsapp";
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

function SupplierUpgrade({ vendor }) {
  const alreadyPro = !!vendor?.isPro;
  const contactUrl = whatsappUrlWithText(
    SUPPORT_PHONE,
    `היי, אשמח לשדרג את הכרטיס שלי (${
      vendor?.name || "ספק"
    }) ב-VaddyGo למסלול פרו 👑`
  );

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
        {alreadyPro ? (
          <p className="upgrade-note">
            <Icon name="check-circle" size={16} />
            <span>הכרטיס שלך כבר במסלול פרו — כל הכלים פתוחים לך 👑</span>
          </p>
        ) : (
          <>
            <p className="upgrade-note">
              <Icon name="crown" size={15} />
              <span>לפתיחת המסלול נשמח לעזור — בהודעה קצרה בוואטסאפ 🙂</span>
            </p>
            <a href={contactUrl} target="_blank" rel="noreferrer">
              <Button variant="brand">
                <Icon name="message" size={16} /> לשדרוג — דברו איתנו
              </Button>
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default SupplierUpgrade;
