import { useState } from "react";
import Select from "../../components/Select";
import Button from "../../components/Button";
import { saveStudentPayment } from "../../services/paymentsService";
import { PAYMENT_METHODS, paymentMethodLabel } from "../../services/paymentMethods";
import { formatShekels } from "../../services/format";

/*
  PaymentRow — שורת קטגוריית גבייה אחת של תלמיד:
  שם הקטגוריה, הסכום, וסטטוס צבעוני (שולם/טרם שולם).
  טרם שולם → בחירת אמצעי תשלום + "סמן ששולם". שולם → אמצעי + "ביטול".
*/
function PaymentRow({ studentId, payment, onSaved }) {
  const [method, setMethod] = useState(payment.method ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function save(isPaid) {
    if (isPaid && !method) {
      setError("יש לבחור אמצעי תשלום");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      await saveStudentPayment(studentId, payment.collectionCategoryId, {
        amount: payment.amount,
        method: method || null,
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
        <span className="payment-row__amount">{formatShekels(payment.amount)}</span>
      </div>

      {payment.isPaid ? (
        <div className="payment-row__actions">
          <span className="payment-row__status">
            שולם ✓ ({paymentMethodLabel(payment.method)})
          </span>
          <Button variant="secondary" onClick={() => save(false)} isLoading={isSaving}>
            ביטול סימון
          </Button>
        </div>
      ) : (
        <div className="payment-row__actions">
          <Select
            id={`payment-method-${payment.collectionCategoryId}`}
            label="אמצעי תשלום"
            value={method}
            onChange={(event) => {
              setMethod(event.target.value);
              setError("");
            }}
            error={error}
          >
            <option value="">בחרי אמצעי...</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
          <Button onClick={() => save(true)} isLoading={isSaving}>
            סמן ששולם
          </Button>
        </div>
      )}
    </div>
  );
}

export default PaymentRow;
