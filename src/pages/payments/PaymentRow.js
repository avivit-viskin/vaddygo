import Input from "../../components/Input";
import { COLLECTION_METHODS } from "../../services/paymentMethods";
import { formatShekels } from "../../services/format";

/*
  PaymentRow — שורת קטגוריית גבייה אחת: שם הקטגוריה + יעד, ולכל אמצעי
  (ביט/פייבוקס/מזומן/אשראי) שדה סכום. רכיב **מבוקר** — הסכומים והשינויים
  מנוהלים ב-StudentPaymentsPage, שם יש כפתור "אישור" אחד ששומר את כל
  הקטגוריות יחד (אין כאן כפתור "שולם" נפרד לכל שורה).
*/
/* "תשלום אחד" / "2 תשלומים" / "3 תשלומים" — כפי שהוגדר ב"עריכת גבייה" */
function installmentsLabel(n) {
  return n === 1 ? "תשלום אחד" : `${n} תשלומים`;
}

function PaymentRow({ payment, installments = 1, amounts, onChange }) {
  // סך ששולם = כל שדות האמצעים שנערכים כאן (ביט/פייבוקס/מזומן/אשראי). שדה
  // האשראי מאותחל מהסכום שכבר נגבה (payment.cardAmount) ולכן נספר דרכו.
  const total = COLLECTION_METHODS.reduce(
    (sum, m) => sum + (Number(amounts[m.value]) || 0),
    0
  );

  // כמה תשלומים "נסגרו" — נגזר מהסכום ששולם מול גובה תשלום בודד (יעד/מס' תשלומים).
  // כך רואים אם התלמיד באמצע תוכנית תשלומים (למשל 1 מתוך 2) ואין מה לדרוש עדיין.
  const installmentSize = installments > 0 ? payment.amount / installments : payment.amount;
  const installmentsPaid =
    installmentSize > 0 ? Math.min(installments, Math.floor(total / installmentSize)) : 0;

  // רקע "שולם" (ירוק) רק כשכוסה כל היעד. תשלום *חלקי* (פחות מהיעד) נשאר ברקע
  // הרגיל — כדי שלא ייראה כאילו שולם הכל.
  const target = Number(payment.amount) || 0;
  const isFullyPaid = target > 0 ? total >= target : total > 0;

  return (
    <div className={`payment-row${isFullyPaid ? " payment-row--paid" : ""}`}>
      <div className="payment-row__head">
        <span className="payment-row__category">{payment.categoryName}</span>
        <span className="payment-row__amount">
          יעד: {formatShekels(payment.amount)} · {installmentsLabel(installments)}
        </span>
      </div>

      <div className="payment-row__methods">
        {COLLECTION_METHODS.map((m) => (
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
        <span className="payment-row__total">
          שולם {formatShekels(total)} מתוך {formatShekels(payment.amount)}
          {installments > 1 && ` · תשלום ${installmentsPaid} מתוך ${installments}`}
        </span>
      </div>
    </div>
  );
}

export default PaymentRow;
