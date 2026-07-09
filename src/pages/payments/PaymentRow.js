import { useState } from "react";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { saveStudentPayment } from "../../services/paymentsService";
import { PAYMENT_METHODS } from "../../services/paymentMethods";
import { formatShekels } from "../../services/format";

/*
  PaymentRow — שורת קטגוריית גבייה אחת של תלמיד:
  שם הקטגוריה + יעד, ולכל אמצעי (ביט/פייבוקס/מזומן) שדה סכום נפרד —
  אפשר לפצל תשלום בין אמצעים. הסך ששולם = סכום השדות.
  טרם שולם → שדות הסכומים + "סמן ששולם". שולם → פירוט + "ביטול סימון".
*/
function PaymentRow({ studentId, payment, onSaved }) {
  const [amounts, setAmounts] = useState({
    bit: payment.bitAmount || "",
    paybox: payment.payBoxAmount || "",
    cash: payment.cashAmount || "",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const total = PAYMENT_METHODS.reduce(
    (sum, m) => sum + (Number(amounts[m.value]) || 0),
    0
  );

  async function save(isPaid) {
    if (isPaid && total <= 0) {
      setError("יש להזין סכום באחד האמצעים כדי לסמן ששולם");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      await saveStudentPayment(studentId, payment.collectionCategoryId, {
        bitAmount: Number(amounts.bit) || 0,
        payBoxAmount: Number(amounts.paybox) || 0,
        cashAmount: Number(amounts.cash) || 0,
        isPaid,
      });
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={`payment-row${payment.isPaid ? " payment-row--paid" : ""}`}>
      <div className="payment-row__head">
        <span className="payment-row__category">{payment.categoryName}</span>
        <span className="payment-row__amount">יעד: {formatShekels(payment.amount)}</span>
      </div>

      {payment.isPaid ? (
        <div className="payment-row__actions">
          <span className="payment-row__status">שולם ✓ ({methodBreakdown(payment)})</span>
          <Button variant="secondary" onClick={() => save(false)} isLoading={isSaving}>
            ביטול סימון
          </Button>
        </div>
      ) : (
        <>
          <div className="payment-row__methods">
            {PAYMENT_METHODS.map((m) => (
              <Input
                key={m.value}
                id={`pay-${payment.collectionCategoryId}-${m.value}`}
                label={m.label}
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="0"
                value={amounts[m.value]}
                onChange={(event) => {
                  setAmounts({ ...amounts, [m.value]: event.target.value });
                  setError("");
                }}
              />
            ))}
          </div>
          <div className="payment-row__actions">
            <span className="payment-row__total">סה"כ ששולם: {formatShekels(total)}</span>
            <Button onClick={() => save(true)} isLoading={isSaving}>
              סמן ששולם
            </Button>
          </div>
          {error && <p className="field__error" role="alert">{error}</p>}
        </>
      )}
    </div>
  );
}

/* פירוט האמצעים ששולמו: "ביט 700, מזומן 500" */
function methodBreakdown(payment) {
  const parts = [];
  if (payment.bitAmount > 0) parts.push(`ביט ${formatShekels(payment.bitAmount)}`);
  if (payment.payBoxAmount > 0) parts.push(`פייבוקס ${formatShekels(payment.payBoxAmount)}`);
  if (payment.cashAmount > 0) parts.push(`מזומן ${formatShekels(payment.cashAmount)}`);
  return parts.join(" · ") || "—";
}

export default PaymentRow;
