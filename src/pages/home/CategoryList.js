import Card from "../../components/Card";
import { formatShekels, formatNumber } from "../../services/format";

/*
  CategoryList — תשלומים לפי קטגוריות (UI_SPEC ס' 8): לכל קטגוריה כמה כסף יצא
  (הוצאה שסווגה לשמה). לקטגוריית גבייה (הזנה/ועד/חוגים...) מוצג "יצא X מתוך
  [היעד]"; לקטגוריית הוצאה בלבד (בלת"ם / מתנות סוף שנה — בלי יעד גבייה) מוצג
  "יצא X" בלבד. כך כל הוצאה מקבלת ריבוע, וסך הריבועים = סך ההוצאות.
*/
function CategoryList({ categories }) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <Card title="תשלומים לפי קטגוריות">
      <ul className="categories">
        {categories.map((category) => {
          const spent = Number(category.spentAmount) || 0;
          const target = Number(category.targetAmount) || 0;
          return (
            <li key={category.name} className="categories__item">
              <span className="categories__name">{category.name}</span>
              <span className="categories__amounts">
                {target > 0
                  ? `יצא ${formatNumber(spent)} מתוך ${formatShekels(target)}`
                  : `יצא ${formatShekels(spent)}`}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default CategoryList;
