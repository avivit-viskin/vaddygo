import { useState } from "react";
import Input from "./Input";
import Select from "./Select";
import Button from "./Button";
import "../styles/supplier-app.css";

/*
  SupplierPayments — דף התשלומים של הספק, מחולק לשלושה כרטיסים: תשלום מהיר
  (קישור ביט/פייבוקס/GROW + ביט), העברה בנקאית, והגדרות (פריסה לתשלומים +
  שמירה). onSave מקבל רק את שדות התשלום; ההורה ממזג לכרטיס המלא ושומר.
*/
function SupplierPayments({ vendor, onSave }) {
  const [paymentLink, setPaymentLink] = useState(vendor?.paymentLink || "");
  const [paymentBit, setPaymentBit] = useState(vendor?.paymentBit || "");
  const [paymentPaybox, setPaymentPaybox] = useState(
    vendor?.paymentPaybox || ""
  );
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
        paymentPaybox: paymentPaybox.trim(),
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
      <div className="sup-card">
        <h3 className="sup-card__title">⚡ אמצעי תשלום מהירים</h3>
        <p className="sup-card__hint">
          מלאו רק את מה שרלוונטי לכם — כל אמצעי יופיע לוועד ככפתור ממותג
          (ביט / פייבוקס / אשראי).
        </p>
        <Input
          id="pay-bit"
          label="ביט — מספר טלפון או קישור"
          value={paymentBit}
          onChange={(e) => setPaymentBit(e.target.value)}
          placeholder="למשל: 054-1234567"
        />
        <Input
          id="pay-paybox"
          label="פייבוקס — מספר טלפון או קישור"
          value={paymentPaybox}
          onChange={(e) => setPaymentPaybox(e.target.value)}
          placeholder="למשל: 054-1234567 או קישור payBox"
        />
        <Input
          id="pay-link"
          label="אשראי — קישור לתשלום מאובטח (סליקה / GROW)"
          type="url"
          value={paymentLink}
          onChange={(e) => setPaymentLink(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="sup-card">
        <h3 className="sup-card__title">🏦 העברה בנקאית</h3>
        <p className="sup-card__hint">אופציונלי — למי שמעדיף להעביר לחשבון.</p>
        <Input
          id="pay-bank"
          label="פרטי העברה בנקאית"
          value={paymentBankInfo}
          onChange={(e) => setPaymentBankInfo(e.target.value)}
          placeholder="בנק · סניף · חשבון · שם המוטב"
        />
      </div>

      <div className="sup-card">
        <h3 className="sup-card__title">⚙️ הגדרות</h3>
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
            className={msg.ok ? "sup-saved" : "field__error"}
            role={msg.ok ? "status" : "alert"}
          >
            {msg.ok ? "✔️ " : ""}
            {msg.text}
          </p>
        )}
        <div className="gift-form__actions">
          <Button type="submit" isLoading={saving}>
            שמירת אמצעי תשלום
          </Button>
        </div>
      </div>
    </form>
  );
}

export default SupplierPayments;
