import WhatsAppIcon from "./WhatsAppIcon";
import { whatsappUrlWithText } from "../services/whatsapp";
import "../styles/support-link.css";

/*
  SupportLink — כפתור "שירות לקוחות" למסכי הכניסה/הרשמה. פותח שיחת וואטסאפ
  ישירה למספר התמיכה של בעלת המוצר עם הודעה מוכנה, כדי שמי שמתקשה להתחבר או
  להירשם יוכל לפנות לעזרה בלחיצה אחת. אותו מספר תמיכה שבתפריט הצד ("צור קשר").
*/
const SUPPORT_PHONE = "054-4579179"; // מספר התמיכה (ציבורי — לא סוד)
const SUPPORT_TEXT = "שלום, אשמח לעזרה עם VaddyGo 🙂";

function SupportLink() {
  return (
    <div className="support-link-wrap">
      <span className="support-link__label">צריכים עזרה?</span>
      <a
        className="support-link"
        href={whatsappUrlWithText(SUPPORT_PHONE, SUPPORT_TEXT)}
        target="_blank"
        rel="noreferrer"
      >
        <WhatsAppIcon size={18} />
        שירות לקוחות
      </a>
    </div>
  );
}

export default SupportLink;
