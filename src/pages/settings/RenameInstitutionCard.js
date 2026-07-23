import { useState } from "react";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import {
  getActiveInstitution,
  renameInstitution,
} from "../../services/institutionsService";
import { renameGroup } from "../../services/groupsService";

/*
  RenameInstitutionCard — שינוי שם המוסד הפעיל (למשל תיקון טעות הקלדה בהרשמה).
  מעדכן את השם מקומית מיד, מנסה לשמור גם בשרת (כדי שהשם יישאר נכון גם אחרי
  ניקוי דפדפן או כניסה ממכשיר אחר), ואז מרענן כדי שהשם החדש יופיע בכל המסכים.
*/
function RenameInstitutionCard() {
  const active = getActiveInstitution();
  const [name, setName] = useState(active?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  if (!active) {
    return (
      <Card title="🏫 שם המוסד">
        <p className="settings__hint">
          עדיין אין מוסד פעיל. אפשר להגדיר מוסד באשף ההרשמה.
        </p>
      </Card>
    );
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("צריך להזין שם למוסד");
      return;
    }
    if (trimmed === active.name) {
      setError("השם זהה לשם הנוכחי — לא בוצע שינוי");
      return;
    }
    setIsSaving(true);
    setError("");

    renameInstitution(active.id, trimmed);
    // שמירה בשרת היא "מאמץ טוב" — אם השרת לא זמין, השם כבר עודכן מקומית
    if (active.serverGroupId) {
      try {
        await renameGroup(active.serverGroupId, trimmed);
      } catch {
        /* נשמר מקומית; יסונכרן לשרת מאוחר יותר */
      }
    }
    // רענון מלא כדי שהשם החדש יופיע בכותרת ובכל המסכים
    window.location.href = "/";
  }

  return (
    <Card title="🏫 שם המוסד">
      <p className="settings__hint">
        כאן אפשר לתקן את שם המוסד אם נפלה טעות בהקלדה. השם החדש יופיע בכל המסכים
        ובהודעות שנשלחות להורים.
      </p>
      <Input
        id="settings-institution-name"
        label="שם המוסד"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setError("");
        }}
        placeholder="למשל: גן הרדוף"
      />
      <div className="settings__save-row">
        <Button onClick={handleSave} isLoading={isSaving}>
          שמירת השם
        </Button>
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}

export default RenameInstitutionCard;
