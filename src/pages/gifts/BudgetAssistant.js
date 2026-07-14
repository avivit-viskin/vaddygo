import Card from "../../components/Card";
import { formatShekels } from "../../services/format";

/*
  BudgetAssistant — העוזרת התקציבית (UI_SPEC ס' 12):
  לכל חג עם תקציב או מתנות מוצג "נוצל X מתוך Y" ו"נשארו Z ₪".
  המנוצל = סכום המתנות המשויכות לחג; המוקצב = תקציב החג שנקבע בלוח השנה.
  כך התקציבים שהוגדרו בלוח השנה (שלב 6) מתחברים למתנות בפועל.
*/
function buildRows(gifts, holidayBudgets) {
  const usedByHoliday = new Map();
  for (const gift of gifts) {
    if (!gift.holidayKey) continue;
    const prev = usedByHoliday.get(gift.holidayKey) || {
      name: gift.holidayName || gift.holidayKey,
      used: 0,
    };
    prev.used += Number(gift.totalAmount) || 0;
    usedByHoliday.set(gift.holidayKey, prev);
  }

  const keys = new Set([
    ...Object.keys(holidayBudgets),
    ...usedByHoliday.keys(),
  ]);

  return [...keys]
    .map((key) => {
      const row = usedByHoliday.get(key);
      const allocated = Number(holidayBudgets[key]) || 0;
      const used = row ? row.used : 0;
      const name = row ? row.name : key.split("|")[0];
      return { key, name, allocated, used, remaining: allocated - used };
    })
    .sort((a, b) => b.allocated + b.used - (a.allocated + a.used));
}

function BudgetAssistant({ gifts, holidayBudgets }) {
  const rows = buildRows(gifts, holidayBudgets);
  if (rows.length === 0) {
    return null;
  }

  return (
    <Card title="הוצאות חגים 💰">
      <ul className="budget-assistant">
        {rows.map((row) => {
          const overBudget = row.allocated > 0 && row.remaining < 0;
          return (
            <li key={row.key} className="budget-assistant__row">
              <span className="budget-assistant__name">{row.name}</span>
              <span className="budget-assistant__figures">
                {row.allocated > 0 ? (
                  <>
                    נוצל {formatShekels(row.used)} מתוך {formatShekels(row.allocated)}
                    <span
                      className={`budget-assistant__remaining${
                        overBudget ? " budget-assistant__remaining--over" : ""
                      }`}
                    >
                      {overBudget
                        ? ` · חריגה של ${formatShekels(-row.remaining)}`
                        : ` · נשארו ${formatShekels(row.remaining)}`}
                    </span>
                  </>
                ) : (
                  <>נוצל {formatShekels(row.used)} · אין תקציב מוגדר לחג</>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="budget-assistant__hint">
        את התקציב לכל חג מגדירים במסך לוח השנה, ליד שם החג.
      </p>
    </Card>
  );
}

export default BudgetAssistant;
