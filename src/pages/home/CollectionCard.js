import { useState } from "react";
import Card from "../../components/Card";
import { formatShekels } from "../../services/format";
import { paymentMethodLabel } from "../../services/paymentMethods";
import PaymentMethodIcon from "../../components/PaymentMethodIcon";
import ExpenseModal from "./ExpenseModal";

/*
  CollectionCard — כרטיס הגבייה הראשי (UI_SPEC ס' 8):
  מציג את יתרת הקופה (נגבה − הוצאות) לצד החוב הפתוח, כפתור לעדכון היתרה
  (רישום הוצאה), בר התקדמות מול היעד, ופירוק לפי אמצעי תשלום (נטו מהוצאות).
*/
function CollectionCard({ dashboard, onExpenseChanged, readOnly = false }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <Card>
      <div className="collection__top">
        <div className="collection__balance">
          <div>
            <p className="collection__label">יתרת הקופה</p>
            <p
              className={`collection__amount collection__amount--${
                dashboard.boxBalance < 0 ? "negative" : "positive"
              }`}
            >
              {formatShekels(dashboard.boxBalance)}
            </p>
          </div>
          <div>
            <p className="collection__label">חוב פתוח</p>
            <p className="collection__amount collection__amount--debt">
              {formatShekels(dashboard.openDebt)}
            </p>
          </div>
        </div>
        {/* "צופה" — לצפייה בלבד: בלי עדכון יתרה (רישום הוצאה) */}
        {!readOnly && (
          <button
            type="button"
            className="collection__edit"
            onClick={() => setEditOpen(true)}
          >
            ✏️ עדכון יתרה
          </button>
        )}
      </div>

      <div
        className="progress"
        role="progressbar"
        aria-valuenow={dashboard.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="התקדמות הגבייה"
      >
        <div
          className="progress__fill"
          style={{ width: `${dashboard.progressPercent}%` }}
        />
      </div>
      <p className="progress__text">{dashboard.progressPercent}% מהיעד נגבה</p>

      <ul className="methods">
        {dashboard.byPaymentMethod.map((m) => (
          <li key={m.method} className={`methods__item methods__item--${m.method}`}>
            <span className="methods__icon">
              <PaymentMethodIcon method={m.method} />
            </span>
            <span className="methods__name">{paymentMethodLabel(m.method)}</span>
            <span className="methods__amount">{formatShekels(m.amount)}</span>
          </li>
        ))}
      </ul>

      <ExpenseModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={onExpenseChanged}
      />
    </Card>
  );
}

export default CollectionCard;
