import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import { PAYMENT_METHODS, paymentMethodLabel } from "../../services/paymentMethods";
import { formatShekels, formatDayMonth } from "../../services/format";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../../services/expensesService";
import {
  EXPENSE_TYPES,
  getCollectionCategoryNames,
} from "../../services/expenseCategories";

/*
  ExpenseModal — "עדכון יתרת הקופה": רישום הוצאה (כמה יצא ומאיזה אמצעי),
  והיסטוריית ההוצאות שאפשר למחוק. אחרי כל שינוי מרעננים את מסך הבית (onSaved)
  כדי שהיתרה והקוביות יתעדכנו.
*/
function ExpenseModal({ isOpen, onClose, onSaved }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bit");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [collectionCategories, setCollectionCategories] = useState([]);
  // הוצאה שממתינה לאישור מחיקה (null = אין דיאלוג פתוח)
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    // איפוס הטופס וטעינת ההיסטוריה והקטגוריות בכל פתיחה
    setAmount("");
    setMethod("bit");
    setCategory("");
    setDescription("");
    setError("");
    setEditingId(null);
    getExpenses()
      .then(setHistory)
      .catch(() => setHistory([]));
    getCollectionCategoryNames().then(setCollectionCategories);
  }, [isOpen]);

  function resetForm() {
    setEditingId(null);
    setAmount("");
    setMethod("bit");
    setCategory("");
    setDescription("");
    setError("");
  }

  // טעינת הוצאה קיימת לטופס לצורך עריכה
  function startEdit(expense) {
    setEditingId(expense.id);
    setAmount(String(expense.amount));
    setMethod(expense.method);
    setCategory(expense.category || "");
    setDescription(expense.description || "");
    setError("");
  }

  async function reloadHistory() {
    try {
      setHistory(await getExpenses());
    } catch {
      // אם השרת לא זמין — משאירים את מה שיש
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("יש להזין סכום הוצאה גדול מ-0");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const payload = {
        amount: value,
        method,
        category,
        description: description.trim(),
      };
      if (editingId != null) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }
      await reloadHistory();
      resetForm();
      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    setIsDeleting(true);
    try {
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
      await reloadHistory();
      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="איזה יופי שחלף האירוע האחרון! עכשיו כדאי לעדכן כדי שנמשיך לנהל נכון 💜"
    >
      <form onSubmit={handleSubmit} noValidate>
        <Input
          id="expense-amount"
          label="סכום הוצאה"
          type="number"
          inputMode="numeric"
          placeholder="למשל: 250"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={error}
        />
        <Select
          id="expense-category"
          label="על מה יורד הכסף?"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">— בחרי (לא חובה) —</option>
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
        <Select
          id="expense-method"
          label="מאיזה ממשק יצא הכסף"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
        <Input
          id="expense-description"
          label="פירוט (לא חובה)"
          placeholder="למשל: מתנה לגננת"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <Button type="submit" isLoading={isSaving}>
            {editingId != null ? "עדכון הוצאה" : "הוספת הוצאה"}
          </Button>
          {editingId != null && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              ביטול
            </Button>
          )}
        </div>
      </form>

      {history.length > 0 && (
        <div className="expenses-history">
          <h3 className="expenses-history__title">הוצאות אחרונות</h3>
          <ul className="expenses-history__list">
            {history.map((e) => (
              <li
                key={e.id}
                className={`expenses-history__item${
                  e.id === editingId ? " expenses-history__item--editing" : ""
                }`}
              >
                <span className="expenses-history__main">
                  {formatShekels(e.amount)}
                  {e.category ? ` · ${e.category}` : ""} ·{" "}
                  {paymentMethodLabel(e.method)}
                  {e.description ? ` · ${e.description}` : ""}
                </span>
                <span className="expenses-history__date">
                  {formatDayMonth(e.date)}
                </span>
                <button
                  type="button"
                  className="expenses-history__edit"
                  aria-label="עריכת הוצאה"
                  onClick={() => startEdit(e)}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="expenses-history__delete"
                  aria-label="מחיקת הוצאה"
                  onClick={() => setExpenseToDelete(e)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        isOpen={expenseToDelete !== null}
        title="מחיקת הוצאה"
        message={
          expenseToDelete
            ? `למחוק את ההוצאה על סך ${formatShekels(expenseToDelete.amount)}? אי אפשר לבטל.`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setExpenseToDelete(null)}
        isLoading={isDeleting}
      />
    </Modal>
  );
}

export default ExpenseModal;
