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

  useEffect(() => {
    getPaymentLinks()
      .then(setLinks)
      .catch(() => {});
  }, []);

  function change(field) {
    return (event) => {
      setLinks((prev) => ({ ...prev, [field]: event.target.value }));
      setSaved(false);
    };
  }

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    try {
      setLinks(await savePaymentLinks(links));
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card title="💳 קישורי תשלום של הוועד">
      <p className="settings__hint">
        הדביקי כאן את קישור התשלום בביט ובקבוצת הפייבוקס. הם ייכנסו אוטומטית
        להודעות בקשת התשלום שנשלחות להורים בוואטסאפ.
      </p>
      <Input
        id="settings-bit-link"
        label="קישור תשלום בביט"
        value={links.bit}
        onChange={change("bit")}
        placeholder="הדביקי כאן את קישור הביט"
      />
      <Input
        id="settings-paybox-link"
        label="קישור קבוצת פייבוקס"
        value={links.paybox}
        onChange={change("paybox")}
        placeholder="הדביקי כאן את קישור קבוצת הפייבוקס"
      />
      <div className="settings__save-row">
        <Button onClick={handleSave} isLoading={isSaving}>
          שמירת הקישורים
        </Button>
        {saved && <span className="settings__saved">נשמר! ✅</span>}
      </div>
    </Card>
  );
}

export default PaymentLinksCard;
