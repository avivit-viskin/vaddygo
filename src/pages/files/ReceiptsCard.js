import { useState } from "react";
import Card from "../../components/Card";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import ConfirmDialog from "../../components/ConfirmDialog";
import ProBadge from "../../components/ProBadge";
import useApi from "../../hooks/useApi";
import { getExpenses, deleteExpense } from "../../services/expensesService";
import { paymentMethodLabel } from "../../services/paymentMethods";
import { formatShekels, formatDayMonth } from "../../services/format";
import { isActiveReadOnly } from "../../services/institutionsService";
import ReceiptCaptureModal from "./ReceiptCaptureModal";
import "../../styles/receipts.css";

/*
  ReceiptsCard — כרטיס "קבלות והוצאות" בעמוד הקבצים. מציג את ההוצאות שיש להן
  תצלום קבלה (אסמכתא), עם כפתור להוספת קבלה חדשה (צילום/גלריה → סכום + קטגוריה).
  כל קבלה היא הוצאה — ולכן היא כבר מקזזת מהיתרה הכללית ומהקטגוריה שנבחרה.
*/
function ReceiptsCard() {
  const readOnly = isActiveReadOnly();
  const { data: expenses, isLoading, error, reload } = useApi(getExpenses);
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState(null); // קבלה לצפייה בגדול
  const [deleting, setDeleting] = useState(null);

  const receipts = (expenses || []).filter((e) => (e.receiptImage || "").trim());

  async function handleDelete() {
    await deleteExpense(deleting.id);
    setDeleting(null);
    reload();
  }

  return (
    <Card
      title={
        <>
          <span aria-hidden="true">🧾</span> קבלות והוצאות{" "}
          <ProBadge title="ניהול קבלות — פיצ'ר פרו" />
        </>
      }
    >
      <p className="files__hint">
        מצלמים קבלה או בוחרים תמונה מהגלריה, רושמים כמה כסף יצא ומאיזו קטגוריה —
        וזה מתעדכן <strong>אוטומטית</strong> ביתרה הכללית ובקטגוריה.
      </p>

      {isLoading && <Spinner />}
      {!isLoading && error && <ErrorMessage message={error} onRetry={reload} />}

      {!isLoading && !error && receipts.length === 0 && (
        <EmptyState icon="🧾" message="עדיין אין קבלות — נצלם את הראשונה?" />
      )}

      {!isLoading && !error && receipts.length > 0 && (
        <ul className="receipts">
          {receipts.map((r) => (
            <li key={r.id} className="receipts__item">
              <button
                type="button"
                className="receipts__thumb-btn"
                onClick={() => setViewing(r)}
                aria-label="צפייה בקבלה"
              >
                <img className="receipts__thumb" src={r.receiptImage} alt="קבלה" />
              </button>
              <div className="receipts__info">
                <span className="receipts__amount">{formatShekels(r.amount)}</span>
                {r.category && <span className="receipts__cat">{r.category}</span>}
                <span className="receipts__date">{formatDayMonth(r.date)}</span>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  className="receipts__delete"
                  aria-label="מחיקת קבלה"
                  onClick={() => setDeleting(r)}
                >
                  <Icon name="trash" size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <Button variant="secondary" onClick={() => setAdding(true)}>
          + הוספת קבלה
        </Button>
      )}

      <ReceiptCaptureModal
        isOpen={adding}
        onClose={() => setAdding(false)}
        onSaved={reload}
      />

      <Modal
        isOpen={viewing !== null}
        onClose={() => setViewing(null)}
        title="קבלה"
      >
        {viewing && (
          <div>
            <img
              src={viewing.receiptImage}
              alt="קבלה"
              style={{ width: "100%", borderRadius: 8 }}
            />
            <p style={{ marginTop: 8, fontWeight: 600 }}>
              {formatShekels(viewing.amount)}
              {viewing.category ? ` · ${viewing.category}` : ""} ·{" "}
              {paymentMethodLabel(viewing.method)}
              {viewing.description ? ` · ${viewing.description}` : ""}
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleting !== null}
        title="מחיקת קבלה"
        message={
          deleting
            ? `למחוק את הקבלה על סך ${formatShekels(
                deleting.amount
              )}? הסכום יוחזר ליתרה. אי אפשר לבטל.`
            : ""
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Card>
  );
}

export default ReceiptsCard;
