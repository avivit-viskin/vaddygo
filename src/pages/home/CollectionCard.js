import { useState } from "react";
import Card from "../../components/Card";
import { formatShekels } from "../../services/format";
import { paymentMethodLabel, paymentMethodIcon } from "../../services/paymentMethods";
import ExpenseModal from "./ExpenseModal";

/*
  CollectionCard — כרטיס הגבייה הראשי (UI_SPEC ס' 8):
  מציג את יתרת הקופה (נגבה − הוצאות) לצד החוב הפתוח, כפתור לעדכון היתרה
  (רישום הוצאה), בר התקדמות מול היעד, ופירוק לפי אמצעי תשלום (נטו מהוצאות).
*/
function CollectionCard({ dashboard, onExpenseChanged }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <Card>
      <div className="collection__top">
        <div className="collection__balance">
          <div>
            <p className="collection__label">יתרת הקופה</p>
            <p className="collection__amount">{formatShekels(dashboard.boxBalance)}</p>
          </div>
          <div>
            <p className="collection__label">חוב פתוח</p>
            <p className="collection__amount collection__amount--debt">
              {formatShekels(dashboard.openDebt)}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="collection__edit"
          onClick={() => setEditOpen(true)}
        >
          ✏️ עדכון יתרה
        </button>
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
          <li key={m.method} className="methods__item">
            <span className="methods__icon" aria-hidden="true">
              {paymentMethodIcon(m.method)}
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
