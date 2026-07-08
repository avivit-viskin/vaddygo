import Card from "../../components/Card";
import { formatShekels } from "../../services/format";

/*
  CategoryList — תשלומים לפי קטגוריות (UI_SPEC ס' 8): הזנה, ועד, חוגים, קלמר.
  לכל קטגוריה: כמה נגבה מתוך היעד שלה.
*/
function CategoryList({ categories }) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <Card title="תשלומים לפי קטגוריות">
      <ul className="categories">
        {categories.map((category) => (
          <li key={category.name} className="categories__item">
            <span className="categories__name">{category.name}</span>
            <span className="categories__amounts">
              {formatShekels(category.collectedAmount)}
              <span className="categories__of"> מתוך </span>
              {formatShekels(category.targetAmount)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default CategoryList;
