import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Button from "../../components/Button";
import { PAYMENT_METHODS } from "../../services/paymentMethods";
import {
  loadPassedForExpense,
  markExpensePrompted,
} from "../../services/passedEvents";
import { createExpense } from "../../services/expensesService";

/*
  ExpenseAfterEventPrompt — אחרי שאירוע/חג עבר, קופץ פעם אחת ושואל כמה כסף יצא
  ומאיזה אמצעי (משימה 25). רישום ההוצאה מוריד אוטומטית מיתרת הקופה. "דלג"
  מסמן שנשאלנו ולא ישאל שוב. עובר פריט-פריט על כל מה שעבר לאחרונה.
*/
function ExpenseAfterEventPrompt({ onRecorded }) {
  const [queue, setQueue] = useState([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bit");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadPassedForExpense().then((list) => {
      if (!cancelled) {
        setQueue(list);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = queue[0];
  if (!current) {
    return null;
  }

  function goNext() {
    markExpensePrompted(current.id);
    setQueue((q) => q.slice(1));
    setAmount("");
    setMethod("bit");
  }

  async function handleRecord(event) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      goNext(); // בלי סכום = דילוג
      return;
    }
    setIsSaving(true);
    try {
      await createExpense({ amount: value, method, description: current.name });
      if (onRecorded) {
        onRecorded();
      }
    } catch {
      // אם לא נשמר — לא חוסמים; אפשר לרשום ידנית ב"עדכון יתרה"
    } finally {
      setIsSaving(false);
      goNext();
    }
  }

  return (
    <Modal isOpen onClose={goNext} title={`${current.name} מאחורינו! 🎉`}>
      <p className="expense-prompt__hint">
        כדי שנמשיך לנהל נכון — כמה כסף יצא על {current.name}? נעדכן את יתרת הקופה.
      </p>
      <form onSubmit={handleRecord} noValidate>
        <Input
          id="event-expense-amount"
          label="סכום הוצאה"
          type="number"
          inputMode="numeric"
          placeholder="למשל: 250 (או השאירי ריק לדילוג)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Select
          id="event-expense-method"
          label="מאיזה אמצעי יצא הכסף"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Button type="submit" isLoading={isSaving}>
            רישום הוצאה
          </Button>
          <Button variant="secondary" onClick={goNext} disabled={isSaving}>
            דלג
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ExpenseAfterEventPrompt;
