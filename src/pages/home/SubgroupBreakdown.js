import { useCallback, useEffect, useState } from "react";
import Card from "../../components/Card";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { formatShekels, formatDayMonth } from "../../services/format";
import { paymentMethodLabel } from "../../services/paymentMethods";
import { getExpenses, deleteExpense } from "../../services/expensesService";
import ExpenseModal from "./ExpenseModal";

/*
  SubgroupBreakdown — פילוח הגבייה לפי קבוצות הגן (תינוקייה/פעוטות/צהרון...).
  לכל קבוצה: מספר ילדים, בר התקדמות וכמה נגבה מול היעד. לחיצה על קבוצה פותחת
  את "כרטיס הקבוצה" — מצב כספי מלא (יתרת קופה, חוב פתוח, יעד, הוצאות) עם אפשרות
  לעדכן יתרה (רישום הוצאה שמשויכת לקבוצה ויורדת מיתרת הקופה שלה). מוצג רק
  כשיש קבוצות עם ילדים.
*/
function SubgroupBreakdown({ subgroups, onExpenseChanged, readOnly = false }) {
  // קבוצות פעילות עם ילדים, וגם קבוצות שנמחקו (נשמרות למעקב)
  const rows = (subgroups || []).filter(
    (s) => (Number(s.childrenCount) || 0) > 0 || s.archived
  );
  const [selectedName, setSelectedName] = useState(null);

  if (rows.length === 0) {
    return null;
  }

  // נגזר מה-props כדי שהכרטיס יתעדכן אוטומטית אחרי רישום הוצאה (רענון הדשבורד)
  const selected = rows.find((r) => r.name === selectedName) || null;

  return (
    <Card
      title={
        <>
          <Icon name="users" size={18} /> גבייה לפי קבוצות
        </>
      }
    >
      <ul className="subgroups">
        {rows.map((sg) => {
          const target = Number(sg.targetAmount) || 0;
          const collected = Number(sg.collectedAmount) || 0;
          const percent =
            target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
          return (
            <li key={sg.name}>
              <button
                type="button"
                className={`subgroup-row${sg.archived ? " subgroup-row--archived" : ""}`}
                onClick={() => setSelectedName(sg.name)}
              >
                <div className="subgroup-row__head">
                  <span className="subgroup-row__name">{sg.name}</span>
                  {sg.archived && <span className="subgroup-row__deleted">נמחקה</span>}
                  <span className="subgroup-row__chip">{sg.childrenCount} ילדים</span>
                  <Icon name="chart" size={16} className="subgroup-row__go" />
                </div>
                <div
                  className="subgroup-row__bar"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="subgroup-row__fill" style={{ width: `${percent}%` }} />
                </div>
                <div className="subgroup-row__amounts">
                  <span className="subgroup-row__collected">
                    {formatShekels(collected)}
                  </span>
                  <span className="subgroup-row__of">מתוך {formatShekels(target)}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <SubgroupDetailModal
        subgroup={selected}
        onClose={() => setSelectedName(null)}
        onExpenseChanged={onExpenseChanged}
        readOnly={readOnly}
      />
    </Card>
  );
}

/* כרטיס הקבוצה — מצב כספי מלא + עדכון יתרה (רישום הוצאה משויכת לקבוצה). */
function SubgroupDetailModal({ subgroup, onClose, onExpenseChanged, readOnly }) {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const name = subgroup?.name;

  // רשימת "על מה הוציאו" של הקבוצה — הוצאות ששויכו לקבוצה הזו
  const loadExpenses = useCallback(() => {
    if (!name) {
      return;
    }
    getExpenses()
      .then((list) =>
        setExpenses((list || []).filter((e) => e.subgroupName === name))
      )
      .catch(() => setExpenses([]));
  }, [name]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // אחרי רישום/מחיקת הוצאה: לרענן גם את הדשבורד (המספרים) וגם את הרשימה כאן
  const afterExpenseChange = () => {
    if (onExpenseChanged) {
      onExpenseChanged();
    }
    loadExpenses();
  };

  async function confirmDelete() {
    setIsDeleting(true);
    try {
      await deleteExpense(toDelete.id);
      setToDelete(null);
      afterExpenseChange();
    } finally {
      setIsDeleting(false);
    }
  }

  if (!subgroup) {
    return null;
  }
  const target = Number(subgroup.targetAmount) || 0;
  const collected = Number(subgroup.collectedAmount) || 0;
  const spent = Number(subgroup.spentAmount) || 0;
  const boxBalance = collected - spent;
  const openDebt = Math.max(0, target - collected);
  const percent = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`קבוצת ${subgroup.name}${subgroup.archived ? " (נמחקה)" : ""}`}
    >
      <div className="subgroup-card">
        {subgroup.archived && (
          <p className="subgroup-card__archived-note">
            הקבוצה נמחקה ונשמרת כאן למעקב — הכסף שנגבה וההוצאות שלה נשמרו.
          </p>
        )}
        <div className="subgroup-card__top">
          <div className="subgroup-card__balance">
            <div>
              <p className="collection__label">יתרת הקופה</p>
              <p
                className={`collection__amount collection__amount--${
                  boxBalance < 0 ? "negative" : "positive"
                }`}
              >
                {formatShekels(boxBalance)}
              </p>
            </div>
            <div>
              <p className="collection__label">חוב פתוח</p>
              <p className="collection__amount collection__amount--debt">
                {formatShekels(openDebt)}
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              className="collection__edit"
              onClick={() => setExpenseOpen(true)}
            >
              <Icon name="pencil" size={15} /> עדכון יתרה
            </button>
          )}
        </div>

        <div
          className="progress"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="progress__fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="progress__text">{percent}% מהיעד נגבה</p>

        <ul className="subgroup-stats">
          <li className="subgroup-stats__item">
            <span className="subgroup-stats__label">יעד גבייה</span>
            <span className="subgroup-stats__value">{formatShekels(target)}</span>
          </li>
          <li className="subgroup-stats__item">
            <span className="subgroup-stats__label">נגבה עד כה</span>
            <span className="subgroup-stats__value">{formatShekels(collected)}</span>
          </li>
          <li className="subgroup-stats__item">
            <span className="subgroup-stats__label">הוצאות הקבוצה</span>
            <span className="subgroup-stats__value">{formatShekels(spent)}</span>
          </li>
          <li className="subgroup-stats__item">
            <span className="subgroup-stats__label">ילדים בקבוצה</span>
            <span className="subgroup-stats__value">{subgroup.childrenCount}</span>
          </li>
        </ul>

        <div className="subgroup-spent">
          <h3 className="subgroup-spent__title">
            <Icon name="wallet" size={16} /> על מה הוציאו בקבוצה
          </h3>
          {expenses.length === 0 ? (
            <p className="subgroup-spent__empty">
              עדיין לא נרשמו הוצאות לקבוצה הזו.
            </p>
          ) : (
            <ul className="subgroup-spent__list">
              {expenses.map((e) => (
                <li key={e.id} className="subgroup-spent__item">
                  <div className="subgroup-spent__info">
                    <span className="subgroup-spent__amount">
                      {formatShekels(e.amount)}
                    </span>
                    <span className="subgroup-spent__meta">
                      {e.category ? `${e.category} · ` : ""}
                      {paymentMethodLabel(e.method)}
                      {e.description ? ` · ${e.description}` : ""}
                    </span>
                  </div>
                  <span className="subgroup-spent__date">
                    {formatDayMonth(e.date)}
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      className="subgroup-spent__delete"
                      aria-label="מחיקת הוצאה"
                      onClick={() => setToDelete(e)}
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ExpenseModal
        isOpen={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        onSaved={afterExpenseChange}
        subgroupName={subgroup.name}
      />

      <ConfirmDialog
        isOpen={toDelete !== null}
        title="מחיקת הוצאה"
        message={
          toDelete
            ? `למחוק את ההוצאה על סך ${formatShekels(toDelete.amount)}? אפשר לשחזר מסל המיחזור.`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
        isLoading={isDeleting}
      />
    </Modal>
  );
}

export default SubgroupBreakdown;
