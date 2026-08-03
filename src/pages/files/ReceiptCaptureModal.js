import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Button from "../../components/Button";
import ExpenseCategorySelect from "../home/ExpenseCategorySelect";
import { PAYMENT_METHODS } from "../../services/paymentMethods";
import { fileToResizedDataUrl } from "../../services/imageUpload";
import { createExpense } from "../../services/expensesService";

/*
  ReceiptCaptureModal — הוספת קבלה/מסמך בעמוד הקבצים: מצלמים (מצלמה) או בוחרים
  תמונה מהגלריה, ואז עונים "כמה כסף יצא?" ו"מאיזו קטגוריה?" (אותו בורר כמו
  "עדכון יתרה"). בשמירה נרשמת הוצאה עם התמונה כאסמכתא — מה שמקזז אוטומטית גם
  מהקטגוריה שנבחרה וגם מהיתרה הכללית (החישוב נגזר מרשימת ההוצאות בשרת).
*/
const pickStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "20px 10px",
  border: "1px dashed var(--color-primary)",
  borderRadius: 12,
  background: "var(--color-primary-light)",
  color: "var(--color-primary-dark)",
  fontWeight: 700,
  fontSize: "var(--font-size-sm)",
  cursor: "pointer",
  textAlign: "center",
};

function ReceiptCaptureModal({ isOpen, onClose, onSaved }) {
  const [image, setImage] = useState(""); // base64 data-URI של הקבלה
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("bit");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);

  // איפוס הטופס בכל פתיחה
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setImage("");
    setAmount("");
    setCategory("");
    setMethod("bit");
    setDescription("");
    setError("");
    setIsSaving(false);
    setImageBusy(false);
  }, [isOpen]);

  async function handlePick(file) {
    if (!file) {
      return;
    }
    setError("");
    setImageBusy(true);
    try {
      // מכווצים ל-1400px כדי שהטקסט בקבלה יישאר קריא אבל המשקל סביר
      const dataUrl = await fileToResizedDataUrl(file, 1400, 0.8);
      setImage(dataUrl);
    } catch (err) {
      setError(err.message || "לא הצלחנו לפתוח את התמונה");
    } finally {
      setImageBusy(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!image) {
      setError("צריך לצלם או לבחור תמונה של הקבלה");
      return;
    }
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("יש להזין סכום גדול מ-0");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await createExpense({
        amount: value,
        method,
        category,
        description: description.trim(),
        receiptImage: image,
      });
      if (onSaved) {
        onSaved();
      }
      onClose();
    } catch (err) {
      setError(err.message || "לא הצלחנו לשמור. אפשר לנסות שוב.");
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="הוספת קבלה / הוצאה 🧾">
      <form onSubmit={handleSubmit} noValidate>
        {image ? (
          <div style={{ marginBottom: 12 }}>
            <img
              src={image}
              alt="תצוגת הקבלה"
              style={{
                width: "100%",
                maxHeight: 280,
                objectFit: "contain",
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
              }}
            />
            <button
              type="button"
              onClick={() => setImage("")}
              style={{
                marginTop: 6,
                border: "none",
                background: "none",
                color: "var(--color-link)",
                fontFamily: "var(--font-family)",
                fontWeight: 600,
                fontSize: "var(--font-size-sm)",
                cursor: "pointer",
              }}
            >
              החלפת תמונה
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <label style={pickStyle}>
              <span style={{ fontSize: 26, lineHeight: 1 }}>📷</span>
              צילום קבלה
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                aria-label="צילום קבלה"
                onChange={(e) => handlePick(e.target.files && e.target.files[0])}
              />
            </label>
            <label style={pickStyle}>
              <span style={{ fontSize: 26, lineHeight: 1 }}>🖼️</span>
              בחירה מהגלריה
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                aria-label="בחירת תמונה מהגלריה"
                onChange={(e) => handlePick(e.target.files && e.target.files[0])}
              />
            </label>
          </div>
        )}
        {imageBusy && (
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              margin: "0 0 10px",
            }}
          >
            מעבד תמונה...
          </p>
        )}

        <Input
          id="receipt-amount"
          label="כמה כסף יצא?"
          type="number"
          inputMode="numeric"
          placeholder="למשל: 250"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <ExpenseCategorySelect
          id="receipt-category"
          label="מאיזו קטגוריה?"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Select
          id="receipt-method"
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
        <Input
          id="receipt-desc"
          label="שם הקבלה לתצוגה (לא חובה)"
          placeholder="למשל: מגש פירות ליום המשפחה"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p
          style={{
            margin: "-6px 0 8px",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-muted)",
          }}
        >
          זה השם שיוצג לקבלה ברשימה.
        </p>
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
        <div style={{ marginTop: 10 }}>
          <Button type="submit" isLoading={isSaving}>
            שמירה — ועדכון היתרה
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ReceiptCaptureModal;
