import { useState } from "react";
import Icon from "./Icon";
import Button from "./Button";
import { getOnboarding, patchOnboarding } from "../services/onboardingService";
import { getActiveServerGroupId } from "../services/institutionsService";
import { updateAllergiesNote } from "../services/groupsService";
import { toastSuccess, toastError } from "../services/toastBus";

/*
  InstitutionAllergyBanner — הערת אלרגיות ברמת המוסד, מוצגת באדום בראש רשימת
  התלמידים. החלטת בעלת המוצר (09.09.2026): לא מציגים אלרגיה לכל ילד בנפרד — רק
  הערה כללית אחת למוסד. ניתנת לעריכה על ידי מי שאינו "צופה", כדי שגם מוסדות
  קיימים (שכבר סיימו את האשף) יוכלו להוסיף/לעדכן אותה מכאן.
*/
function InstitutionAllergyBanner({ readOnly = false }) {
  const [note, setNote] = useState(() => getOnboarding()?.allergiesNote || "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  function openEdit() {
    setDraft(note);
    setEditing(true);
  }

  async function save() {
    const trimmed = draft.trim();
    const groupId = getActiveServerGroupId();
    setBusy(true);
    try {
      if (groupId != null) {
        await updateAllergiesNote(groupId, trimmed);
      }
      // מעדכנים גם את המטמון המקומי כדי שההערה תוצג מיד ותישרד רענון
      patchOnboarding({ allergiesNote: trimmed });
      setNote(trimmed);
      setEditing(false);
      toastSuccess("הערת האלרגיות נשמרה");
    } catch {
      toastError("לא הצלחנו לשמור. אפשר לנסות שוב.");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="allergy-banner allergy-banner--edit">
        <label className="allergy-banner__label" htmlFor="allergy-note-input">
          <Icon name="warning" size={16} /> אלרגיות במוסד (יוצג לכל חברי הוועד)
        </label>
        <textarea
          id="allergy-note-input"
          className="allergy-banner__input"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="למשל: אלרגיה לבוטנים, לאגוזים ולביצים"
        />
        <div className="allergy-banner__actions">
          <Button onClick={save} isLoading={busy}>
            שמירה
          </Button>
          <Button variant="secondary" onClick={() => setEditing(false)}>
            ביטול
          </Button>
        </div>
      </div>
    );
  }

  if (note) {
    return (
      <div className="allergy-banner" role="alert">
        <span className="allergy-banner__icon">
          <Icon name="warning" size={18} />
        </span>
        <span className="allergy-banner__text">
          <strong>אלרגיות במוסד:</strong> {note}
        </span>
        {!readOnly && (
          <button
            type="button"
            className="allergy-banner__edit"
            onClick={openEdit}
          >
            עריכה
          </button>
        )}
      </div>
    );
  }

  // אין הערה עדיין — "צופה" לא רואה כלום; אחר יכול להוסיף
  if (readOnly) {
    return null;
  }
  return (
    <div className="allergy-banner allergy-banner--add">
      <Button variant="secondary" onClick={openEdit}>
        <Icon name="warning" size={15} /> הוספת הערת אלרגיות למוסד
      </Button>
    </div>
  );
}

export default InstitutionAllergyBanner;
