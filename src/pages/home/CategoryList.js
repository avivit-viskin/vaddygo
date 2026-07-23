import Card from "../../components/Card";
import { formatShekels, formatNumber } from "../../services/format";

/*
  CategoryList — תשלומים לפי קטגוריות (UI_SPEC ס' 8): הזנה, ועד, חוגים, קלמר.
  לכל קטגוריה שורה אחת: כמה כסף יצא מהקטגוריה (הוצאה שסווגה לשמה) מתוך היעד שלה.
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
                יצא {formatNumber(spent)} מתוך {formatShekels(target)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default CategoryList;
