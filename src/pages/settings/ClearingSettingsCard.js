import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { getClearing, saveClearing } from "../../services/clearingSettingsService";

/*
  ClearingSettingsCard — חשבון סליקת האשראי של הוועד. כל ועד מחבר את המפתחות
  של *חשבון הספק שלו* (המקושר לחשבון הבנק שלו), כדי שכסף הגבייה יגיע ישירות
  אליו. המפתחות הסודיים נשמרים בשרת ולעולם לא מוצגים חזרה — לעדכון מקלידים מחדש.
*/
function ClearingSettingsCard() {
  const [status, setStatus] = useState({ pageUid: "", hasClearing: false });
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [pageUid, setPageUid] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getClearing()
      .then((c) => {
        setStatus(c);
        setPageUid(c.pageUid || "");
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    setError("");
    try {
      const c = await saveClearing({ provider: "payplus", apiKey, secretKey, pageUid });
      setStatus(c);
      setApiKey("");
      setSecretKey("");
      setSaved(true);
    } catch (err) {
      setError(err.message || "השמירה נכשלה, אפשר לנסות שוב");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card title="💳 חשבון סליקת אשראי (של הוועד)">
      <p className="settings__hint">
        כדי לגבות באשראי, כל ועד מחבר את חשבון הסליקה <strong>שלו</strong> (PayPlus)
        — כך הכסף מגיע ישירות לחשבון הבנק שלכם. את המפתחות מקבלים מהספק אחרי
        ההרשמה אליו.{" "}
        {status.hasClearing ? "חשבון מחובר ✅" : "עדיין לא חובר חשבון."}
      </p>
      <Input
        id="clearing-api-key"
        label="API Key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        autoComplete="off"
        placeholder={status.hasClearing ? "מחובר — הקלידו כדי להחליף" : "הדביקו כאן"}
      />
      <Input
        id="clearing-secret-key"
        label="Secret Key"
        type="password"
        value={secretKey}
        onChange={(e) => setSecretKey(e.target.value)}
        autoComplete="off"
        placeholder={status.hasClearing ? "מחובר — הקלידו כדי להחליף" : "הדביקו כאן"}
      />
      <Input
        id="clearing-page-uid"
        label="מזהה עמוד תשלום (Payment Page UID)"
        value={pageUid}
        onChange={(e) => setPageUid(e.target.value)}
        autoComplete="off"
        placeholder="הדביקו כאן"
      />
      <div className="settings__save-row">
        <Button onClick={handleSave} isLoading={isSaving}>
          שמירת חשבון הסליקה
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

export default ClearingSettingsCard;
