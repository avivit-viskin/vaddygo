import { useState } from "react";
import Card from "../../components/Card";
import Input from "../../components/Input";
import { formatShekels } from "../../services/format";
import {
  computeBudgetRecommendation,
  getBudgetRates,
  setBudgetRate,
} from "../../services/budgetRecommendation";
import "../../styles/budget-rec.css";

/*
  BudgetRecommendation — עוזרת התקציב (משימה 22), מעל הספקים במסך המתנות:
  חלוקת תקציב מומלצת ל-5 קטגוריות לפי מספר הילדים והצוות ותקציבי החגים.
  אפשר להתאים את הסכומים ליחידה — וההמלצה מתעדכנת מיד.
*/
function BudgetRecommendation({ holidayBudgets }) {
  const [rates, setRates] = useState(getBudgetRates);
  const [showRates, setShowRates] = useState(false);

  const { rows, total } = computeBudgetRecommendation(holidayBudgets, rates);

  function changeRate(key) {
    return (event) => setRates(setBudgetRate(key, event.target.value));
  }

  return (
    <Card title="עוזרת תקציב 🤖">
      <p className="budget-rec__hint">
        המלצה לחלוקת התקציב, מחושבת לפי מספר הילדים והצוות. הכל משוער — אפשר
        להתאים את הסכומים.
      </p>
      <ul className="budget-rec">
        {rows.map((row) => (
          <li key={row.key} className="budget-rec__row">
            <span className="budget-rec__name">{row.name}</span>
            <span className="budget-rec__note">{row.note}</span>
            <span className="budget-rec__amount">{formatShekels(row.amount)}</span>
          </li>
        ))}
        <li className="budget-rec__row budget-rec__row--total">
          <span className="budget-rec__name">סה"כ מומלץ</span>
          <span className="budget-rec__amount">{formatShekels(total)}</span>
        </li>
      </ul>

      <button
        type="button"
        className="budget-rec__toggle"
        onClick={() => setShowRates((v) => !v)}
      >
        ⚙️ התאמת הסכומים
      </button>
      {showRates && (
        <div className="budget-rec__rates">
          <Input
            id="rate-staff"
            label="לכל איש צוות (₪)"
            type="number"
            value={rates.staffPerPerson}
            onChange={changeRate("staffPerPerson")}
          />
          <Input
            id="rate-child"
            label="יום הולדת לילד (₪)"
            type="number"
            value={rates.childBirthday}
            onChange={changeRate("childBirthday")}
          />
          <Input
            id="rate-eoy"
            label="מתנת סוף שנה לילד (₪)"
            type="number"
            value={rates.endOfYearPerChild}
            onChange={changeRate("endOfYearPerChild")}
          />
          <Input
            id="rate-misc"
            label='בלת"מ (%)'
            type="number"
            value={rates.miscPercent}
            onChange={changeRate("miscPercent")}
          />
        </div>
      )}
    </Card>
  );
}

export default BudgetRecommendation;
