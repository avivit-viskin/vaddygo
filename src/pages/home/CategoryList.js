import Card from "../../components/Card";
import { formatShekels } from "../../services/format";

/*
  CategoryList — תשלומים לפי קטגוריות (UI_SPEC ס' 8): הזנה, ועד, חוגים, קלמר.
  לכל קטגוריה: כמה נגבה מתוך היעד שלה, וכשיצא כסף מהקטגוריה (הוצאה שסווגה לשמה)
  גם כמה יצא וכמה נשאר בפועל — כך הוצאה בקטגוריית "ועד" מפחיתה את הקטגוריה.
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
          // ההוצאה יורדת מהסכום הכולל של הקטגוריה (היעד), כמו שביקשה בעלת המוצר
          const remaining = (Number(category.targetAmount) || 0) - spent;
          return (
            <li key={category.name} className="categories__item">
              <span className="categories__name">{category.name}</span>
              <span className="categories__amounts">
                <span>
                  {formatShekels(category.collectedAmount)}
                  <span className="categories__of"> מתוך </span>
                  {formatShekels(category.targetAmount)}
                </span>
                {spent > 0 && (
                  <small className="categories__spent">
                    יצא {formatShekels(spent)} מתוך{" "}
                    {formatShekels(category.targetAmount)} · נשאר{" "}
                    {formatShekels(remaining)}
                  </small>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default CategoryList;
