import { useCallback, useEffect, useState } from "react";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import { getExpenses, deleteExpense } from "../../services/expensesService";
import { paymentMethodLabel } from "../../services/paymentMethods";
import { formatShekels, formatDayMonth } from "../../services/format";

/*
  ExpensesList — כל ההוצאות בדף הבית, מתחת לימי ההולדת. כאן רואים בכל רגע כל
  הוצאה שנרשמה — מהפופאפ, מהתזכורת במסך המתנות או מ"עדכון יתרה" — ואפשר למחוק.
  מתרענן אחרי כל שינוי דרך refreshSignal (מגיע מדף הבית).
*/
function ExpensesList({ refreshSignal = 0, onChanged }) {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    setIsLoading(true);
    getExpenses()
      .then((list) => setExpenses(list || []))
      .catch(() => setExpenses([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshSignal]);

  async function handleDelete(id) {
    try {
      await deleteExpense(id);
      load();
      if (onChanged) {
        onChanged();
      }
    } catch {
      // אם לא נמחק (שרת לא זמין) — משאירים את הרשימה כמו שהיא
    }
  }

  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <Card title="ההוצאות שלי 🧾">
      {isLoading ? (
        <p className="expenses-list__loading">טוען…</p>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon="🧾"
          message="עדיין אין הוצאות — כל הוצאה שתירשם תופיע כאן."
        />
      ) : (
        <>
          <ul className="expenses-list__list">
            {expenses.map((e) => (
              <li key={e.id} className="expenses-list__item">
                <span className="expenses-list__main">
                  {formatShekels(e.amount)} · {paymentMethodLabel(e.method)}
                  {e.description ? ` · ${e.description}` : ""}
                </span>
                <span className="expenses-list__date">
                  {formatDayMonth(e.date)}
                </span>
                <button
                  type="button"
                  className="expenses-list__delete"
                  aria-label="מחיקת הוצאה"
                  onClick={() => handleDelete(e.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <p className="expenses-list__total">
            סה"כ יצא: <strong>{formatShekels(total)}</strong>
          </p>
        </>
      )}
    </Card>
  );
}

export default ExpensesList;
