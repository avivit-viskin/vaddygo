import { useState } from "react";
import { nextHoliday } from "../services/upcomingHoliday";
import { holidayEmoji } from "../data/holidays";

/*
  SupplierHolidayNudge — דחיפה עדינה לספק לקראת החג הקרוב: "עוד שבועיים פורים —
  זה הזמן לעדכן מבצע/מוצרים כדי שהוועדים ימצאו אתכם". החגים הם שיא הרכישות של
  ועדי ההורים (מתנות לצוות/לילדים), וספק שמעודכן בדיוק לפני החג מקבל יותר פניות.

  מבוסס על לוח השנה העברי הקיים בצד הלקוח (upcomingHoliday) — בלי שרת. מוצג רק
  כשהחג בטווח NUDGE_WINDOW ימים, וניתן לסגירה לכל חג בנפרד (נזכר במכשיר).
*/
const NUDGE_WINDOW_DAYS = 40;
const DISMISS_PREFIX = "vaddygo.supplierHolidayNudge.";

function SupplierHolidayNudge({ onGoTo, hasOffer = false }) {
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
      <button
        type="button"
        className="sup-holiday__close"
        aria-label="סגירה"
        onClick={close}
      >
        ✕
      </button>
      <span className="sup-holiday__emoji" aria-hidden="true">
        {emoji}
      </span>
      <div className="sup-holiday__text">
        <strong className="sup-holiday__title">
          {holiday.name} {when} — זה הזמן להתכונן
        </strong>
        <p className="sup-holiday__sub">
          חגים הם שיא הרכישות של הוועדים. {hasOffer ? "עדכנו" : "הוסיפו"} מבצע
          לחג ורעננו מוצרים — כך תופיעו בדיוק כשהוועדים מחפשים.
        </p>
      </div>
      {onGoTo && (
        <button
          type="button"
          className="sup-holiday__cta"
          onClick={() => onGoTo("home")}
        >
          {hasOffer ? "לעדכון המבצע »" : "להוספת מבצע »"}
        </button>
      )}
    </div>
  );
}

export default SupplierHolidayNudge;
