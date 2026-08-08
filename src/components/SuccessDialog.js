import Modal from "./Modal";
import Button from "./Button";

/*
  SuccessDialog — חלון אישור גנרי אחרי פעולה שהצליחה ("נשמר בהצלחה").
  עוטף את Modal עם סימן ✓, הודעה וכפתור סגירה אחד. משלים את ConfirmDialog
  (שנועד לשאול לפני פעולה) — כאן רק מאשרים למשתמשת שהפעולה עברה.
*/
function SuccessDialog({
  isOpen,
  title = "נשמר בהצלחה",
  message = "השינויים נשמרו ✓",
  // "הבנתי" ולא "סגירה" — כדי לא להתנגש בכפתור ה-✕ של Modal (שנקרא "סגירה")
  closeLabel = "הבנתי",
  onClose,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="confirm-dialog__message">{message}</p>
      <div className="form-actions">
        <Button onClick={onClose}>{closeLabel}</Button>
      </div>
    </Modal>
  );
}

export default SuccessDialog;
