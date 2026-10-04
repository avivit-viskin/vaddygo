import { useState } from "react";
import Card from "../../components/Card";
import { nextHoliday } from "../../services/upcomingHoliday";
import { formatDayMonth } from "../../services/format";
import { holidayEmoji } from "../../data/holidays";
import { isDismissed, dismissNotice } from "../../services/dismissedNotices";

/* כמה ימים לפני האירוע מתחילים להזכיר לסדר את המתנות (שבוע). */
const GIFT_REMINDER_DAYS = 7;

/*
  CountdownBanner — ספירה לאחור לחג הקרוב (UI_SPEC ס' 12):
  "חנוכה ב-25.11 — נשארו עוד 32 ימים". בשבוע שלפני האירוע הבאנר הופך לתזכורת.
  אפשר להסתיר אותו ב-X (נשמר) — וכשיגיע החג הבא, הוא יופיע שוב.
*/
function CountdownBanner({ today, onViewSuppliers }) {
  const holiday = nextHoliday(today || new Date());
  const noticeId = holiday
    ? `countdown:${holiday.name}:${formatDayMonth(holiday.date)}`
    : "";
  const [hidden, setHidden] = useState(() =>
    holiday ? isDismissed(noticeId) : false
  );

  if (!holiday || hidden) {
    return null;
  }

  const isSoon = holiday.daysUntil <= GIFT_REMINDER_DAYS; // שבוע לפני האירוע
  const daysText =
    holiday.daysUntil === 0
      ? "היום!"
      : holiday.daysUntil === 1
      ? "נשאר עוד יום אחד"
      : `נשארו עוד ${holiday.daysUntil} ימים`;

  function handleDismiss() {
    dismissNotice(noticeId);
    setHidden(true);
  }

  return (
    <Card>
      <div className={`countdown${isSoon ? " countdown--soon" : ""}`}>
        <span className="countdown__icon" aria-hidden="true">
          {isSoon ? "🎁" : holidayEmoji(holiday.name) || "🎉"}
        </span>
        <div className="countdown__body">
          <p className="countdown__title">
            {holiday.name} ב-{formatDayMonth(holiday.date)}
          </p>
          <p className="countdown__days">
            {daysText}
            {isSoon && " · זה הזמן לסדר את המתנות 🎁"}
          </p>
          {/* קיצור דרך ישר לספקים — החגים הם שיא הרכישות, וכך הוועד מגיע
              לספקים (והמבצעים שלהם) בדיוק ברגע הנכון. style מוטבע כי ה-CSS
              של אזור הספקים/המתנות בעריכה של תהליך אחר. */}
          {onViewSuppliers && (
            <button
              type="button"
              onClick={onViewSuppliers}
              style={{
                marginTop: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "var(--color-primary-dark)",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "var(--font-size-sm)",
                cursor: "pointer",
              }}
            >
              לספקים עם מבצעים לחג ←
            </button>
          )}
        </div>
        <button
          type="button"
          className="countdown__dismiss"
          aria-label="הסתרת ההתראה"
          onClick={handleDismiss}
        >
          ✕
        </button>
      </div>
    </Card>
  );
}

export default CountdownBanner;
