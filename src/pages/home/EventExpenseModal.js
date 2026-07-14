import { useState } from "react";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Button from "../../components/Button";
import { PAYMENT_METHODS } from "../../services/paymentMethods";
import { createExpense } from "../../services/expensesService";

/*
  EventExpenseModal — חלון קטן שרושם כמה כסף יצא על אירוע/חג שעבר ומאיזה אמצעי.
  משמש גם בפופאפ שקופץ בדף הבית וגם בתזכורת שממתינה במסך המתנות, כדי שהתנהגות
  הרישום תהיה זהה בשני המקומות. onRecorded(item) נקרא רק אחרי שמירה מוצלחת.
*/
function EventExpenseModal({ item, onClose, onRecorded, closeLabel = "דלג" }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bit");
  const [isSaving, setIsSaving] = useState(false);

  async function handleRecord(event) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      onClose(); // בלי סכום = סגירה בלי רישום
      return;
    }
    setIsSaving(true);
    try {
      await createExpense({ amount: value, method, description: item.name });
      if (onRecorded) {
        onRecorded(item);
      }
    } catch {
      // אם לא נשמר — לא חוסמים; אפשר לרשום ידנית ב"עדכון יתרה"
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={`${item.name} מאחורינו! 🎉`}>
      <p className="expense-prompt__hint">
        כדי שנמשיך לנהל נכון — כמה כסף יצא על {item.name}? נעדכן את יתרת הקופה.
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
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            {closeLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EventExpenseModal;
