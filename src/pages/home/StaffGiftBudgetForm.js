import { useState } from "react";
import Input from "../../components/Input";
import Button from "../../components/Button";

/*
  StaffGiftBudgetForm — הזנת/עריכת התקציב המומלץ למתנה לאיש צוות (סכום בש"ח).
*/
function StaffGiftBudgetForm({ current, onSave, onCancel }) {
  const [amount, setAmount] = useState(
    current || current === 0 ? String(current) : ""
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const value = Number(amount);
    if (!amount.trim() || Number.isNaN(value) || value < 0) {
      setError("יש להזין סכום תקין");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      await onSave(value);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="staff-gift__hint">
        כמה מומלץ להשקיע על המתנה? הסכום יישמר ויוצג ליד יום ההולדת.
      </p>
      <Input
        id="staff-gift-budget"
        label="תקציב מומלץ למתנה (₪)"
        type="number"
        min="0"
        inputMode="numeric"
        value={amount}
        onChange={(event) => {
          setAmount(event.target.value);
          setError("");
        }}
        error={error}
      />
      <div className="form-actions">
        <Button type="submit" isLoading={isSaving}>
          שמירה
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
          ביטול
        </Button>
      </div>
    </form>
  );
}

export default StaffGiftBudgetForm;
