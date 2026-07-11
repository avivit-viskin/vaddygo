import Input from "../../components/Input";
import { PAYMENT_METHODS } from "../../services/paymentMethods";
import { formatShekels } from "../../services/format";

/*
  PaymentRow — שורת קטגוריית גבייה אחת: שם הקטגוריה + יעד, ולכל אמצעי
  (ביט/פייבוקס/מזומן) שדה סכום. רכיב **מבוקר** — הסכומים והשינויים מנוהלים
  ב-StudentPaymentsPage, שם יש כפתור "אישור" אחד ששומר את כל הקטגוריות יחד
  (אין כאן כפתור "שולם" נפרד לכל שורה).
*/
/* "תשלום אחד" / "2 תשלומים" / "3 תשלומים" — כפי שהוגדר ב"עריכת גבייה" */
function installmentsLabel(n) {
  return n === 1 ? "תשלום אחד" : `${n} תשלומים`;
}

function PaymentRow({ payment, installments = 1, amounts, onChange }) {
  const total = PAYMENT_METHODS.reduce(
    (sum, m) => sum + (Number(amounts[m.value]) || 0),
    0
  );

  return (
    <div className={`payment-row${total > 0 ? " payment-row--paid" : ""}`}>
      <div className="payment-row__head">
        <span className="payment-row__category">{payment.categoryName}</span>
        <span className="payment-row__amount">
          יעד: {formatShekels(payment.amount)} · {installmentsLabel(installments)}
        </span>
      </div>

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
            onChange={(event) =>
              onChange({ ...amounts, [m.value]: event.target.value })
            }
          />
        ))}
      </div>

      <div className="payment-row__actions">
        <span className="payment-row__total">סה"כ ששולם: {formatShekels(total)}</span>
      </div>
    </div>
  );
}

export default PaymentRow;
