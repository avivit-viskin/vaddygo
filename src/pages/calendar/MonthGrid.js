/*
  MonthGrid — רשת חודש: כותרות ימי השבוע, מספרי ימים, תגי חגים ואירועים.
  year/monthIndex — החודש המוצג; holidaysByDay/eventsByDay — Map: יום → שמות.
*/
const WEEKDAY_LABELS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "שבת"];

function MonthGrid({ year, monthIndex, holidaysByDay, eventsByDay }) {
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
                  <>
                    <span className="calendar-day__number">{day}</span>
                    {(holidaysByDay.get(day) || []).map((name) => (
                      <span
                        key={name}
                        className="calendar-day__badge calendar-day__badge--holiday"
                        title={name}
                      >
                        {name}
                      </span>
                    ))}
                    {(eventsByDay.get(day) || []).map((event) => (
                      <span
                        key={event.id}
                        className="calendar-day__badge calendar-day__badge--event"
                        title={event.name}
                      >
                        {event.name}
                      </span>
                    ))}
                  </>
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
