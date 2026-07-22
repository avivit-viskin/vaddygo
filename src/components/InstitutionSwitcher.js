import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getInstitutions,
  getActiveInstitution,
  setActiveInstitution,
  removeInstitution,
} from "../services/institutionsService";
import { deleteGroup } from "../services/groupsService";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";

/*
  InstitutionSwitcher — רשימת המוסדות של המשתמשת + מעבר ביניהם (UI_SPEC ס' 3.5).
  מוסד פעיל מסומן; מעבר למוסד מופעל טוען את נתוניו (רענון). מוסד לא-מופעל
  ("🔒 להפעלה") מוביל למסך הרכישה הזמני. אפשר גם למחוק מוסד בודד (🗑️) — מוחק
  רק אותו ואת נתוניו, בלי לגעת בחשבון או בשאר המוסדות, עם אישור בהקלדת השם.
*/
function InstitutionSwitcher({ onClose }) {
  const navigate = useNavigate();
  const institutions = getInstitutions();
  const active = getActiveInstitution();

  // המוסד שממתין לאישור מחיקה (null = אין חלון פתוח)
  const [toDelete, setToDelete] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  if (institutions.length === 0) {
    return <p className="institutions__empty">עדיין אין מוסדות — נגדיר באשף ההרשמה.</p>;
  }

  function handleClick(institution) {
    if (institution.id === active?.id) {
      onClose?.();
      return;
    }
    if (institution.activated) {
      setActiveInstitution(institution.id);
      // רענון מלא כדי שכל המסכים ייטענו עם נתוני המוסד הפעיל החדש
      window.location.href = "/";
    } else {
      onClose?.();
      navigate(`/institutions/${institution.id}/purchase`);
    }
  }

  function openDelete(institution) {
    setToDelete(institution);
    setConfirmText("");
    setError("");
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError("");
    try {
      // נתוני השרת (אם המוסד כבר מופעל ומקושר לגן) נמחקים קודם
      if (toDelete.serverGroupId) {
        await deleteGroup(toDelete.serverGroupId);
      }
      removeInstitution(toDelete.id);
      // רענון מלא — נטען עם המוסד הפעיל החדש, או לאשף אם לא נשאר אף מוסד
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "המחיקה נכשלה, אפשר לנסות שוב");
      setIsDeleting(false);
    }
  }

  return (
    <>
      <ul className="institutions">
        {institutions.map((institution) => (
          <li key={institution.id} className="institutions__row">
            <button
              type="button"
              className={`institutions__item${
                institution.id === active?.id ? " institutions__item--active" : ""
              }`}
              onClick={() => handleClick(institution)}
            >
              <span className="institutions__name">🏫 {institution.name}</span>
              {institution.id === active?.id ? (
                <span className="institutions__badge">פעיל</span>
              ) : !institution.activated ? (
                <span className="institutions__badge institutions__badge--locked">
                  🔒 להפעלה
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className="institutions__delete"
              aria-label={`מחיקת המוסד ${institution.name}`}
              onClick={() => openDelete(institution)}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>

      <Modal
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={`מחיקת המוסד: ${toDelete?.name || ""}`}
      >
        <p>
          פעולה זו תמחק <strong>רק את המוסד הזה</strong> ואת כל הנתונים שלו —
          תלמידים, תשלומים, צוות, הוצאות ומתנות. <strong>החשבון שלך ושאר
          המוסדות יישארו כמו שהם.</strong> לא ניתן לשחזר.
        </p>
        <Input
          id="delete-institution-confirm"
          label={`כדי לאשר, יש להקליד את שם המוסד: ${toDelete?.name || ""}`}
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
            disabled={confirmText.trim() !== (toDelete?.name || "").trim()}
            onClick={handleDelete}
          >
            מחיקת המוסד
          </Button>
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            ביטול
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default InstitutionSwitcher;
