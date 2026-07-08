import { useState } from "react";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Button from "../../components/Button";
import BrandName from "../../components/BrandName";

/*
  HolidayBudgetDialog — חלון הגדרת תקציב לחג, עם הנוסח של בעלת המוצר.
  holiday: { name, hebrewYear } · currentAmount: תקציב קיים (לעריכה) או null.
*/
function HolidayBudgetDialog({ holiday, currentAmount, onSave, onClose }) {
  const [amount, setAmount] = useState(
    currentAmount != null ? String(currentAmount) : ""
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setError("נא להזין סכום בש״ח (מספר גדול מאפס)");
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
    <Modal isOpen={Boolean(holiday)} onClose={onClose} title={`תקציב לחג — ${holiday?.name}`}>
      <p>
        שלום לך, לפני שנמשיך לנהל נכון בעזרת <BrandName /> נא לציין את
        התקציב שייצא בחג זה:
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <Input
          id="holiday-budget-amount"
          label={'סכום (בש"ח) *'}
          type="number"
          min="1"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={error}
          placeholder="למשל: 800"
        />
        <Button type="submit" isLoading={isSaving}>
          שמירת התקציב
        </Button>
      </form>
    </Modal>
  );
}

export default HolidayBudgetDialog;
