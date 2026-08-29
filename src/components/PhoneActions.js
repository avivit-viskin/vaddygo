import { useState } from "react";
import Icon from "./Icon";
import WhatsAppIcon from "./WhatsAppIcon";
import { whatsappUrl } from "../services/whatsapp";

/*
  PhoneActions — מספר טלפון לחיץ שפותח בחירה: חיוג או שליחת וואטסאפ.
  לחיצה על המספר פותחת/סוגרת תפריט קטן עם שתי אפשרויות (בקשת בעלת המוצר).
  בשימוש בכרטיס התלמיד לשני מספרי ההורים. אם אין מספר — לא מציג כלום.
*/
function PhoneActions({ phone, label = "ההורה" }) {
  const [open, setOpen] = useState(false);
  const trimmed = String(phone || "").trim();
  if (!trimmed) return null;
  const wa = whatsappUrl(trimmed);

  return (
    <span className="phone-actions">
      <button
        type="button"
        className="phone-actions__number"
        dir="ltr"
        aria-expanded={open}
        aria-label={`אפשרויות יצירת קשר עם ${label}: ${trimmed}`}
        onClick={() => setOpen((v) => !v)}
      >
        {trimmed}
      </button>
      {open && (
        <span className="phone-actions__menu" role="menu">
          <a
            className="phone-actions__item"
            href={`tel:${trimmed}`}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Icon name="phone" size={15} /> חיוג
          </a>
          {wa && (
            <a
              className="phone-actions__item phone-actions__item--wa"
              href={wa}
              target="_blank"
              rel="noreferrer"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <WhatsAppIcon size={15} /> וואטסאפ
            </a>
          )}
        </span>
      )}
    </span>
  );
}

export default PhoneActions;
