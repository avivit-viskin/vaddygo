import { whatsappUrl } from "../services/whatsapp";
import WhatsAppIcon from "./WhatsAppIcon";

/*
  WhatsAppFab — כפתור צף ל"צור קשר" בוואטסאפ עם התמיכה, מוצג ליד עוזרת ה-AI
  (מעל כפתור ה-AI, מעל הניווט התחתון). מספר התמיכה ציבורי — לא סוד.
*/
const SUPPORT_PHONE = "054-4579179";
const SUPPORT_MESSAGE = "שלום, אשמח לעזרה עם VaddyGo 🙂";

function WhatsAppFab() {
  const href = `${whatsappUrl(SUPPORT_PHONE)}?text=${encodeURIComponent(
    SUPPORT_MESSAGE
  )}`;
  return (
    <a
      className="whatsapp-fab"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="צור קשר בוואטסאפ"
    >
      <span className="whatsapp-fab__icon" aria-hidden="true">
        <WhatsAppIcon color="#ffffff" size={22} />
      </span>
    </a>
  );
}

export default WhatsAppFab;
