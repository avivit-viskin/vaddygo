import { useState } from "react";
import Card from "../../components/Card";
import Icon from "../../components/Icon";
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
function BudgetRecommendation({ holidayBudgets, spent = 0, vendors = [], onOpen }) {
  const [rates, setRates] = useState(getBudgetRates);
  const [showRates, setShowRates] = useState(false);

  const { rows, total } = computeBudgetRecommendation(holidayBudgets, rates);
  const remaining = total - spent;

  // ספקים עם מתנות משתלמות — מחשבים לכל ספק את המחיר ההתחלתי (המוצר הזול שלו)
  // וממיינים מהזול ליקר, כדי שהוועד ימצא מהר אפשרות שמתאימה לתקציב. כך המספר
  // שבעוזרת הופך לפעולה: לחיצה פותחת את הספק (ופנייה פוטנציאלית — מקור ההכנסה).
  const affordableVendors = (vendors || [])
    .map((vendor) => {
      const prices = (vendor.products || [])
        .map((p) => Number(p.price))
        .filter((n) => n > 0);
      return prices.length ? { vendor, from: Math.min(...prices) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.from - b.from)
    .slice(0, 6);

  function changeRate(key) {
    return (event) => setRates(setBudgetRate(key, event.target.value));
  }

  return (
    <Card
      title={
        <>
          <Icon name="robot" size={20} /> עוזרת תקציב
        </>
      }
    >
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
        <li className="budget-rec__row budget-rec__row--spent">
          <span className="budget-rec__name">כבר הוצאתם</span>
          <span className="budget-rec__note">ממתנות שסומנו "בוצע"</span>
          <span className="budget-rec__amount">{formatShekels(spent)}</span>
        </li>
        <li className="budget-rec__row budget-rec__row--remaining">
          <span className="budget-rec__name">נשאר מהמומלץ</span>
          <span
            className={`budget-rec__amount${
              remaining < 0 ? " budget-rec__amount--over" : ""
            }`}
          >
            {remaining < 0
              ? `חריגה של ${formatShekels(-remaining)}`
              : formatShekels(remaining)}
          </span>
        </li>
      </ul>

      <button
        type="button"
        className="budget-rec__toggle"
        onClick={() => setShowRates((v) => !v)}
      >
        <Icon name="settings" size={16} /> התאמת הסכומים
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

      {/* גשר מהתקציב לספקים — ספקים עם מתנות משתלמות, מהזול ליקר */}
      {onOpen && affordableVendors.length > 0 && (
        <div className="budget-rec__vendors">
          <p className="budget-rec__vendors-title">
            💡 ספקים עם מתנות משתלמות — למצוא משהו בתקציב
          </p>
          <div className="budget-rec__vendors-list">
            {affordableVendors.map(({ vendor, from }) => (
              <button
                key={vendor.id}
                type="button"
                className="budget-rec__vendor"
                onClick={() => onOpen(vendor)}
              >
                <span className="budget-rec__vendor-name">{vendor.name}</span>
                <span className="budget-rec__vendor-price">
                  מ-{formatShekels(from)} ←
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default BudgetRecommendation;
