import { useState } from "react";
import { nextHoliday } from "../services/upcomingHoliday";
import { holidayEmoji } from "../data/holidays";

/*
  SupplierHolidayNudge — שורת דחיפה עדינה וקומפקטית לספק לקראת החג הקרוב:
  "פורים בעוד שבועיים — הוסיפו מבצע". החגים הם שיא הרכישות של ועדי ההורים,
  וספק שמעודכן בדיוק לפני החג מקבל יותר פניות.

  מבוסס על לוח השנה העברי הקיים בצד הלקוח (upcomingHoliday) — בלי שרת. מוצג רק
  כשהחג בטווח NUDGE_WINDOW ימים, שורה אחת בלבד (לא תופס מקום), וניתן לסגירה
  לכל חג בנפרד (נזכר במכשיר). לחיצה על ה-CTA מובילה ישר לעורך המבצע.
*/
const NUDGE_WINDOW_DAYS = 40;
const DISMISS_PREFIX = "vaddygo.supplierHolidayNudge.";

function SupplierHolidayNudge({ onAddOffer, hasOffer = false }) {
  const holiday = nextHoliday();
  const dismissKey = holiday ? DISMISS_PREFIX + holiday.key : null;
  const [dismissed, setDismissed] = useState(() => {
    if (!dismissKey) return false;
    try {
      return localStorage.getItem(dismissKey) === "1";
    } catch {
      return false;
    }
  });

  if (!holiday || dismissed || holiday.daysUntil > NUDGE_WINDOW_DAYS) {
    return null;
  }

  const close = () => {
    setDismissed(true);
    try {
      if (dismissKey) localStorage.setItem(dismissKey, "1");
    } catch {
      /* אין localStorage — ייסגר לפחות לסשן הזה */
    }
  };

  const emoji = holidayEmoji(holiday.name) || "🎉";
  const when =
    holiday.daysUntil <= 0
      ? "היום"
      : holiday.daysUntil === 1
      ? "מחר"
      : `בעוד ${holiday.daysUntil} ימים`;

  return (
    <div className="sup-holiday" role="status">
      <span className="sup-holiday__emoji" aria-hidden="true">
        {emoji}
      </span>
      <span className="sup-holiday__line">
        <strong>
          {holiday.name} {when}
        </strong>{" "}
        — {hasOffer ? "עדכנו מבצע לחג" : "הוסיפו מבצע לחג"} כדי שהוועדים ימצאו אתכם
      </span>
      {onAddOffer && (
        <button type="button" className="sup-holiday__cta" onClick={onAddOffer}>
          {hasOffer ? "לעדכון »" : "להוספה »"}
        </button>
      )}
      <button
        type="button"
        className="sup-holiday__close"
        aria-label="סגירה"
        onClick={close}
      >
        ✕
      </button>
    </div>
  );
}

export default SupplierHolidayNudge;
