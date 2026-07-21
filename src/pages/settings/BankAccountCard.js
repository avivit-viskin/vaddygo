import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { getBankAccount, saveBankAccount } from "../../services/bankAccountService";

/*
  BankAccountCard — חשבון הבנק של הוועד לקבלת תשלומי אשראי. במקום מפתחות (שחבר
  ועד לא-טכני לא יודע לייצר) — פשוט מזינים את פרטי חשבון הבנק, והכסף מהסליקה
  מגיע ישירות לחשבון הזה (מודל "חשבונות מחוברים" של ספק הסליקה).
*/
function BankAccountCard() {
  const [acct, setAcct] = useState({ holder: "", bank: "", branch: "", account: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getBankAccount()
      .then(setAcct)
      .catch(() => {});
  }, []);

  function change(field) {
    return (event) => {
      setAcct((prev) => ({ ...prev, [field]: event.target.value }));
      setSaved(false);
      setError("");
    };
  }

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    setError("");
    try {
      setAcct(await saveBankAccount(acct));
      setSaved(true);
    } catch (err) {
      setError(err.message || "השמירה נכשלה, נסי שוב");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card title="🏦 חשבון בנק לקבלת תשלומי אשראי">
      <p className="settings__hint">
        כדי לקבל תשלומי אשראי מההורים ישירות לחשבון של הוועד — הזינו את פרטי חשבון
        הבנק. אין צורך במפתחות או בקוד; הכסף מהסליקה מגיע ישירות לחשבון הזה.
      </p>
      <Input
        id="bank-holder"
        label="שם בעל/ת החשבון"
        value={acct.holder}
        onChange={change("holder")}
      />
      <Input
        id="bank-name"
        label="בנק"
        value={acct.bank}
        onChange={change("bank")}
        placeholder="למשל: לאומי / הפועלים / דיסקונט"
      />
      <Input
        id="bank-branch"
        label="מספר סניף"
        value={acct.branch}
        onChange={change("branch")}
        inputMode="numeric"
      />
      <Input
        id="bank-account"
        label="מספר חשבון"
        value={acct.account}
        onChange={change("account")}
        inputMode="numeric"
      />
      <div className="settings__save-row">
        <Button onClick={handleSave} isLoading={isSaving}>
          שמירת פרטי הבנק
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

export default BankAccountCard;
