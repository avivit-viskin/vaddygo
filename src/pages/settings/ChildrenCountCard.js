import { useState } from "react";
import Card from "../../components/Card";
import Icon from "../../components/Icon";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { updateChildrenCount } from "../../services/groupsService";
import { getOnboarding, patchOnboarding } from "../../services/onboardingService";

/*
  ChildrenCountCard — עדכון מספר הילדים בגן ממסך ההגדרות. מספר הילדים קובע את
  היעד לגבייה (מספר ילדים × סכומי הקטגוריות), ולכן משפיע ישירות על יתרת הקופה
  ועל החוב הכללי במסך הבית. אחרי שמירה מעדכנים גם את המטמון המקומי כדי שהחישוב
  יתעדכן מיד.
*/
function ChildrenCountCard() {
  const onboarding = getOnboarding();
  const groupId = onboarding?.groupId;
  const [count, setCount] = useState(String(onboarding?.childrenCount ?? ""));
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 0 || n > 10000) {
      setError("יש להזין מספר שלם בין 0 ל-10000");
      return;
    }
    setIsSaving(true);
    setSaved(false);
    setError("");
    try {
      await updateChildrenCount(groupId, n);
      // מעדכנים את המטמון כדי שהיעד/החוב במסך הבית יתעדכנו מיד
      patchOnboarding({ childrenCount: n });
      setSaved(true);
    } catch (err) {
      setError(err.message || "השמירה נכשלה, אפשר לנסות שוב");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card
      title={
        <>
          <Icon name="users" size={20} /> מספר ילדים בגן
        </>
      }
    >
      <p className="settings__hint">
        מספר הילדים קובע את יעד הגבייה (מספר ילדים × סכומי הקטגוריות), ולכן
        משפיע על <strong>יתרת הקופה</strong> ועל <strong>החוב הכללי</strong>
        במסך הבית.
      </p>
      <Input
        id="settings-children-count"
        label="מספר הילדים"
        type="number"
        inputMode="numeric"
        value={count}
        onChange={(event) => {
          setCount(event.target.value);
          setSaved(false);
          setError("");
        }}
        placeholder="למשל: 28"
      />
      {!groupId && (
        <p className="settings__hint">
          כדי לשמור בשרת צריך גן מסונכרן. אם נרשמת עכשיו — כדאי לרענן ולנסות שוב.
        </p>
      )}
      <div className="settings__save-row">
        <Button onClick={handleSave} isLoading={isSaving} disabled={!groupId}>
          שמירת מספר הילדים
        </Button>
        {saved && <span className="settings__saved">נשמר! ✅</span>}
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}

export default ChildrenCountCard;
