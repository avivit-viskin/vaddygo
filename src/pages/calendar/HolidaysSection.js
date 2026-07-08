import { holidayBudgetKey } from "../../services/holidayBudgetsService";

/*
  HolidaysSection — מדור "חגים": שם ותאריך של כל חג בחודש המוצג,
  עם כפתור להגדרת/עריכת התקציב שייצא בחג (נשמר לכל מופע חג).
*/
const dateFormatter = new Intl.DateTimeFormat("he", {
  day: "numeric",
  month: "numeric",
});

function formatOccurrenceDates(year, monthIndex, days) {
  const first = dateFormatter.format(new Date(year, monthIndex, days[0]));
  if (days.length === 1) return first;
  const last = dateFormatter.format(
    new Date(year, monthIndex, days[days.length - 1])
  );
  return `${first}–${last}`;
}

function HolidaysSection({ year, monthIndex, occurrences, budgets, onEditBudget }) {
  return (
    <section className="calendar-list" aria-label="חגים החודש">
      <h3>חגים</h3>
      {occurrences.length === 0 && <p>אין חגים בחודש הזה.</p>}
      {occurrences.map((occurrence) => {
        const budget =
          budgets[holidayBudgetKey(occurrence.name, occurrence.hebrewYear)];
        return (
          <div
            className="calendar-list__item"
            key={`${occurrence.name}-${occurrence.hebrewYear}`}
          >
            <span className="calendar-list__date">
              {formatOccurrenceDates(year, monthIndex, occurrence.days)}
            </span>
            <span className="calendar-list__name">{occurrence.name}</span>
            {budget != null ? (
              <button
                type="button"
                className="holiday-budget-chip"
                aria-label={`עריכת התקציב לחג ${occurrence.name}`}
                onClick={() => onEditBudget(occurrence)}
              >
                תקציב: {budget.toLocaleString("he")} ₪ ✏️
              </button>
            ) : (
              <button
                type="button"
                className="holiday-budget-chip holiday-budget-chip--empty"
                aria-label={`הגדרת תקציב לחג ${occurrence.name}`}
                onClick={() => onEditBudget(occurrence)}
              >
                + הגדרת תקציב
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}

export default HolidaysSection;
