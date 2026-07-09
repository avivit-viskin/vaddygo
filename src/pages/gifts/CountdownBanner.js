import Card from "../../components/Card";
import { nextHoliday } from "../../services/upcomingHoliday";
import { formatDayMonth } from "../../services/format";

/*
  CountdownBanner — ספירה לאחור לחג הקרוב (UI_SPEC ס' 12):
  "חנוכה ב-25.11 — נשארו עוד 32 ימים". התאריך מחושב מלוח השנה העברי, לא מומצא.
*/
function CountdownBanner({ today }) {
  const holiday = nextHoliday(today || new Date());
  if (!holiday) {
    return null;
  }

  const daysText =
    holiday.daysUntil === 0
      ? "היום!"
      : holiday.daysUntil === 1
      ? "נשאר עוד יום אחד"
      : `נשארו עוד ${holiday.daysUntil} ימים`;

  return (
    <Card>
      <div className="countdown">
        <span className="countdown__icon" aria-hidden="true">
          🎉
        </span>
        <div>
          <p className="countdown__title">
            {holiday.name} ב-{formatDayMonth(holiday.date)}
          </p>
          <p className="countdown__days">{daysText}</p>
        </div>
      </div>
    </Card>
  );
}

export default CountdownBanner;
