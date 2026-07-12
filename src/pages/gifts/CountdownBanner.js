import Card from "../../components/Card";
import { nextHoliday } from "../../services/upcomingHoliday";
import { formatDayMonth } from "../../services/format";

/* כמה ימים לפני האירוע מתחילים להזכיר לסדר את המתנות (שבוע). */
const GIFT_REMINDER_DAYS = 7;

/*
  CountdownBanner — ספירה לאחור לחג הקרוב (UI_SPEC ס' 12):
  "חנוכה ב-25.11 — נשארו עוד 32 ימים". התאריך מחושב מלוח השנה העברי, לא מומצא.
  בשבוע שלפני האירוע (≤7 ימים) הבאנר הופך לתזכורת בולטת לסידור המתנות.
*/
function CountdownBanner({ today }) {
  const holiday = nextHoliday(today || new Date());
  if (!holiday) {
    return null;
  }

  const isSoon = holiday.daysUntil <= GIFT_REMINDER_DAYS; // שבוע לפני האירוע

  const daysText =
    holiday.daysUntil === 0
      ? "היום!"
      : holiday.daysUntil === 1
      ? "נשאר עוד יום אחד"
      : `נשארו עוד ${holiday.daysUntil} ימים`;

  return (
    <Card>
      <div className={`countdown${isSoon ? " countdown--soon" : ""}`}>
        <span className="countdown__icon" aria-hidden="true">
          {isSoon ? "🎁" : "🎉"}
        </span>
        <div>
          <p className="countdown__title">
            {holiday.name} ב-{formatDayMonth(holiday.date)}
          </p>
          <p className="countdown__days">{daysText}</p>
          {isSoon && (
            <p className="countdown__reminder">
              🔔 {holiday.name} כבר בשבוע הקרוב — זה הזמן לסדר את המתנות!
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default CountdownBanner;
