import Modal from "./Modal";
import Button from "./Button";

/*
  ConfirmDialog — דיאלוג אישור גנרי לפעולות שאי אפשר לבטל (למשל מחיקה).
  עוטף את Modal עם הודעה, כפתור אישור אדום וכפתור ביטול.
*/
function ConfirmDialog({
  isOpen,
  title = "אישור פעולה",
  message,
  confirmLabel = "כן, למחוק",
  cancelLabel = "ביטול",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  isLoading = false,
  error = "",
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p className="confirm-dialog__message">{message}</p>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
