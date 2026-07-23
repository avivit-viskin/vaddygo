import Card from "../../components/Card";
import { formatShekels } from "../../services/format";

/*
  CategoryList — תשלומים לפי קטגוריות (UI_SPEC ס' 8): הזנה, ועד, חוגים, קלמר.
  לכל קטגוריה שורה אחת: כמה כסף יצא מהקטגוריה (הוצאה שסווגה לשמה) מתוך היעד שלה,
  וכמה נשאר לתשלום — כך הוצאה בקטגוריית "ועד" מפחיתה את מה שנשאר בקטגוריה.
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
          // ההוצאה יורדת מהיעד; מה שנשאר לתשלום = היעד פחות מה שיצא (לא שלילי)
          const remaining = Math.max(0, target - spent);
          return (
            <li key={category.name} className="categories__item">
              <span className="categories__name">{category.name}</span>
              <span className="categories__amounts">
                יצא {formatShekels(spent)} מתוך {formatShekels(target)} · נשאר
                לתשלום {formatShekels(remaining)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default CategoryList;
