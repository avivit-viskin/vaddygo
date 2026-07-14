import { hebrewDayGematria } from "../../services/hebrewDate";
import { holidayEmoji } from "../../data/holidays";
import WhiteShirtIcon from "../../components/WhiteShirtIcon";

/*
  MonthGrid — רשת חודש: כותרות ימי השבוע, מספרי ימים (לועזי + עברי),
  תגי חגים ואירועים. לחיצה על יום פותחת הוספת אירוע באותו תאריך (נוח בנייד).
  year/monthIndex — החודש המוצג; holidaysByDay/eventsByDay — Map: יום → שמות.
*/
const WEEKDAY_LABELS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "שבת"];

// היום העברי של כל תאריך — מהלוח העברי המובנה בדפדפן, מומר לאותיות (גימטריה)
const hebrewDayFormatter = new Intl.DateTimeFormat("he-u-ca-hebrew", {
  day: "numeric",
});
function hebrewDayLetters(date) {
  return hebrewDayGematria(hebrewDayFormatter.format(date));
}

function MonthGrid({
  year,
  monthIndex,
  holidaysByDay,
  eventsByDay,
  roshChodeshDays,
  onDayClick,
}) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startOffset = new Date(year, monthIndex, 1).getDay(); // 0 = ראשון
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === monthIndex;

  const weeks = [];
  let currentWeek = new Array(startOffset).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  return (
    <table className="calendar-grid">
      <thead>
        <tr>
          {WEEKDAY_LABELS.map((label) => (
            <th key={label} scope="col">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, weekIndex) => (
          <tr key={weekIndex}>
            {week.map((day, dayIndex) => (
              <td
                key={dayIndex}
                className={
                  day && isCurrentMonth && day === today.getDate()
                    ? "calendar-day--today"
                    : undefined
                }
              >
                {day && (
                  <button
                    type="button"
                    className="calendar-day__cell"
                    onClick={() => onDayClick?.(day)}
                    aria-label={`הוספת אירוע ב-${day} בחודש`}
                  >
                    <span className="calendar-day__nums">
                      <span className="calendar-day__number">{day}</span>
                      <span className="calendar-day__hebrew">
                        {hebrewDayLetters(new Date(year, monthIndex, day, 12))}
                      </span>
                    </span>
                    {roshChodeshDays?.has(day) && (
                      <span
                        className="calendar-day__badge calendar-day__badge--rosh-chodesh"
                        title='ראש חודש — חולצה לבנה'
                      >
                        <WhiteShirtIcon size={11} /> ר"ח
                      </span>
                    )}
                    {(holidaysByDay.get(day) || []).map((name) => {
                      const isEve = name.startsWith("ערב ");
                      const emoji = holidayEmoji(name);
                      return (
                        <span
                          key={name}
                          className={`calendar-day__badge ${
                            isEve
                              ? "calendar-day__badge--eve"
                              : "calendar-day__badge--holiday"
                          }`}
                          title={name}
                        >
                          {emoji ? `${emoji} ` : ""}
                          {name}
                        </span>
                      );
                    })}
                    {(eventsByDay.get(day) || []).map((event) => (
                      <span
                        key={event.id}
                        className="calendar-day__badge calendar-day__badge--event"
                        title={event.name}
                      >
                        {event.name}
                      </span>
                    ))}
                  </button>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default MonthGrid;
