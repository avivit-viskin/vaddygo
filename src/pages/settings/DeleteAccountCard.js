import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import { deleteAccount, logout } from "../../services/authService";

/*
  DeleteAccountCard — מחיקת חשבון וכל הנתונים ("הזכות להימחק"). פעולה בלתי הפיכה,
  ולכן דורשת הקלדת מילת אישור לפני המחיקה הסופית. לאחר המחיקה מתנתקים וחוזרים
  למסך הפתיחה.
*/
const CONFIRM_WORD = "מחיקה";

function DeleteAccountCard() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  function open() {
    setConfirmText("");
    setError("");
    setIsOpen(true);
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError("");
    try {
      await deleteAccount();
      logout();
      navigate("/welcome", { replace: true });
    } catch (err) {
      setError(err.message);
      setIsDeleting(false);
    }
  }

  return (
    <Card title="⚠️ מחיקת חשבון">
      <p className="settings__hint">
        מחיקת החשבון תמחק <strong>לצמיתות</strong> את כל הנתונים שלך — תלמידים,
        תשלומים, צוות, הוצאות ומתנות. לא ניתן לשחזר.
      </p>
      <Button variant="danger" onClick={open}>
        מחיקת החשבון והנתונים
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="מחיקת חשבון לצמיתות"
      >
        <p>
          פעולה זו <strong>בלתי הפיכה</strong> — כל הנתונים שלך יימחקו מהשרת.
          כדי לאשר, יש להקליד את המילה <strong>{CONFIRM_WORD}</strong>:
        </p>
        <Input
          id="delete-confirm"
          label={`יש להקליד "${CONFIRM_WORD}" לאישור`}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Button
            variant="danger"
            isLoading={isDeleting}
            disabled={confirmText.trim() !== CONFIRM_WORD}
            onClick={handleDelete}
          >
            מחיקה סופית
          </Button>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            ביטול
          </Button>
        </div>
      </Modal>
    </Card>
  );
}

export default DeleteAccountCard;
