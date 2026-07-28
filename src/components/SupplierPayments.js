import { useState } from "react";
import Input from "./Input";
import Select from "./Select";
import Button from "./Button";

/*
  SupplierPayments — דף התשלומים של הספק: קישור לביט/פייבוקס/GROW, מספר ביט,
  פרטי העברה בנקאית, ומספר תשלומים אפשרי. הוועד משתמש באלה כדי לשלם לספק.
  onSave מקבל רק את שדות התשלום; ההורה ממזג אותם לכרטיס המלא ושומר.
*/
function SupplierPayments({ vendor, onSave }) {
  const [paymentLink, setPaymentLink] = useState(vendor?.paymentLink || "");
  const [paymentBit, setPaymentBit] = useState(vendor?.paymentBit || "");
  const [paymentBankInfo, setPaymentBankInfo] = useState(
    vendor?.paymentBankInfo || ""
  );
  const [paymentInstallments, setPaymentInstallments] = useState(
    vendor?.paymentInstallments || 0
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      await onSave({
        paymentLink: paymentLink.trim(),
        paymentBit: paymentBit.trim(),
        paymentBankInfo: paymentBankInfo.trim(),
        paymentInstallments: Number(paymentInstallments) || 0,
      });
      setMsg({ ok: true, text: "אמצעי התשלום נשמרו" });
    } catch (err) {
      setMsg({ ok: false, text: err.message || "לא הצלחנו לשמור. נסו שוב." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="supplier-edit__login-hint">
        כך הוועד ישלם לכם. אפשר למלא אחת או יותר מהאפשרויות — ומה שתמלאו יוצג
        לוועד בכפתור התשלום.
      </p>
      <Input
        id="pay-link"
        label="קישור תשלום (ביט / פייבוקס / GROW / כל קישור)"
        type="url"
        value={paymentLink}
        onChange={(e) => setPaymentLink(e.target.value)}
        placeholder="https://..."
      />
      <Input
        id="pay-bit"
        label="ביט (מספר טלפון)"
        value={paymentBit}
        onChange={(e) => setPaymentBit(e.target.value)}
        placeholder="למשל: 054-1234567"
      />
      <Input
        id="pay-bank"
        label="פרטי העברה בנקאית"
        value={paymentBankInfo}
        onChange={(e) => setPaymentBankInfo(e.target.value)}
        placeholder="בנק · סניף · חשבון · שם המוטב"
      />
      <Select
        id="pay-installments"
        label="פריסה לתשלומים (כמה תשלומים מותר לוועד)"
        value={paymentInstallments}
        onChange={(e) => setPaymentInstallments(e.target.value)}
      >
        <option value={0}>תשלום אחד (בלי פריסה)</option>
        {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
          <option key={n} value={n}>
            עד {n} תשלומים
          </option>
        ))}
      </Select>
      {msg && (
        <p
          className={msg.ok ? "supplier-edit__saved" : "field__error"}
          role={msg.ok ? "status" : "alert"}
        >
          {msg.ok ? "✓ " : ""}
          {msg.text}
        </p>
      )}
      <div className="gift-form__actions">
        <Button type="submit" isLoading={saving}>
          שמירת אמצעי תשלום
        </Button>
      </div>
    </form>
  );
}

export default SupplierPayments;
