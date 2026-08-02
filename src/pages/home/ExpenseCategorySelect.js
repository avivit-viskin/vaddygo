import { useEffect, useState } from "react";
import Select from "../../components/Select";
import {
  EXPENSE_TYPES,
  getCollectionCategoryNames,
} from "../../services/expenseCategories";

/*
  ExpenseCategorySelect — בורר "על מה יורד הכסף?" הזהה לזה שב"עדכון יתרה":
  קבוצה של קטגוריות הגבייה של המוסד (מהשרת) + קבוצה של סוגי הוצאה קבועים.
  משמש גם ברישום קבלה בעמוד הקבצים, כדי שהחוויה תהיה זהה.
*/
function ExpenseCategorySelect({
  id = "expense-category",
  label = "על מה יורד הכסף?",
  value,
  onChange,
}) {
  const [collectionCategories, setCollectionCategories] = useState([]);

  useEffect(() => {
    let alive = true;
    getCollectionCategoryNames().then((names) => {
      if (alive) {
        setCollectionCategories(names);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Select id={id} label={label} value={value} onChange={onChange}>
      <option value="">— בחירה (לא חובה) —</option>
      {collectionCategories.length > 0 && (
        <optgroup label="קטגוריות הגבייה שלך">
          {collectionCategories.map((name) => (
            <option key={`cat-${name}`} value={name}>
              {name}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label="סוגי הוצאה">
        {EXPENSE_TYPES.map((type) => (
          <option key={`type-${type}`} value={type}>
            {type}
          </option>
        ))}
      </optgroup>
    </Select>
  );
}

export default ExpenseCategorySelect;
