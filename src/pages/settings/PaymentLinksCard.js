import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import {
  getPaymentLinks,
  savePaymentLinks,
} from "../../services/paymentSettingsService";

/*
  PaymentLinksCard — קישורי התשלום של הוועד (ביט + קבוצת פייבוקס). נשמרים
  ברמת הגן (כל חברות הוועד רואות אותם), ונכנסים אוטומטית לבקשות התשלום
  שנשלחות להורים בוואטסאפ (בודדות וגורפות).
*/
function PaymentLinksCard() {
  const [links, setLinks] = useState({ bit: "", paybox: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPaymentLinks()
      .then(setLinks)
      .catch(() => {});
  }, []);

  function change(field) {
    return (event) => {
      setLinks((prev) => ({ ...prev, [field]: event.target.value }));
      setSaved(false);
      setError("");
    };
  }

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    setError("");
    try {
      setLinks(await savePaymentLinks(links));
      setSaved(true);
    } catch (err) {
      setError(err.message || "השמירה נכשלה, אפשר לנסות שוב");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card title="💳 קישורי תשלום של הוועד">
      <p className="settings__hint">
        בביט — מספר הטלפון שאליו משלמים; בפייבוקס — קישור קבוצת התשלום. הם ייכנסו
        אוטומטית להודעות בקשת התשלום שנשלחות להורים בוואטסאפ.
      </p>
      <Input
        id="settings-bit-link"
        label="מספר טלפון לתשלום בביט"
        value={links.bit}
        onChange={change("bit")}
        placeholder="למשל: 050-1234567"
      />
      <Input
        id="settings-paybox-link"
        label="קישור קבוצת פייבוקס"
        value={links.paybox}
        onChange={change("paybox")}
        placeholder="כאן מדביקים את קישור קבוצת הפייבוקס"
      />
      <div className="settings__save-row">
        <Button onClick={handleSave} isLoading={isSaving}>
          שמירת הקישורים
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

export default PaymentLinksCard;
