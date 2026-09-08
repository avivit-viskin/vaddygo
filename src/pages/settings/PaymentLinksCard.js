import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Icon from "../../components/Icon";
import Input from "../../components/Input";
import Button from "../../components/Button";
import {
  getPaymentLinks,
  savePaymentLinks,
} from "../../services/paymentSettingsService";

/*
  PaymentLinksCard — קישורי התשלום של הוועד: ביט + קבוצת פייבוקס, וכן קישורי
  תשלום נוספים שהוועד מוסיף בעצמו (שם + כתובת) — למשל קישור אשראי, העברה בנקאית
  או כל אמצעי אחר. נשמרים ברמת הגן (כל חברות הוועד רואות אותם), ונכנסים אוטומטית
  לבקשות התשלום שנשלחות להורים בוואטסאפ.
*/
function PaymentLinksCard() {
  const [links, setLinks] = useState({ bit: "", paybox: "", customLinks: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPaymentLinks()
      .then((l) =>
        setLinks({
          bit: l.bit || "",
          paybox: l.paybox || "",
          customLinks: Array.isArray(l.customLinks) ? l.customLinks : [],
        })
      )
      .catch(() => {});
  }, []);

  function touched(next) {
    setLinks(next);
    setSaved(false);
    setError("");
  }

  function change(field) {
    return (event) => touched({ ...links, [field]: event.target.value });
  }

  function addCustomLink() {
    touched({ ...links, customLinks: [...links.customLinks, { label: "", url: "" }] });
  }
  function updateCustomLink(index, field, value) {
    const customLinks = links.customLinks.map((l, i) =>
      i === index ? { ...l, [field]: value } : l
    );
    touched({ ...links, customLinks });
  }
  function removeCustomLink(index) {
    touched({
      ...links,
      customLinks: links.customLinks.filter((_, i) => i !== index),
    });
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
    <Card
      title={
        <>
          <Icon name="card" size={20} /> קישורי תשלום של הוועד
        </>
      }
    >
      <p className="settings__hint">
        בביט — מספר הטלפון שאליו משלמים; בפייבוקס — קישור קבוצת התשלום. אפשר
        להוסיף גם קישורים נוספים משלכם. כולם ייכנסו אוטומטית להודעות בקשת התשלום
        שנשלחות להורים בוואטסאפ.
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

      {/* קישורי תשלום נוספים — שם + כתובת, עם הוספה/הסרה דינמית */}
      <p
        className="settings__hint"
        style={{ marginTop: 16, marginBottom: 4, fontWeight: 700 }}
      >
        קישורי תשלום נוספים
      </p>
      {links.customLinks.map((link, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 120px", minWidth: 0 }}>
            <Input
              id={`settings-custom-label-${i}`}
              label="שם הקישור"
              value={link.label}
              onChange={(e) => updateCustomLink(i, "label", e.target.value)}
              placeholder="למשל: תשלום באשראי"
            />
          </div>
          <div style={{ flex: "2 1 160px", minWidth: 0 }}>
            <Input
              id={`settings-custom-url-${i}`}
              label="כתובת (קישור)"
              value={link.url}
              onChange={(e) => updateCustomLink(i, "url", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <button
            type="button"
            onClick={() => removeCustomLink(i)}
            aria-label="הסרת הקישור"
            style={{
              flexShrink: 0,
              width: 42,
              height: 42,
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              background: "none",
              color: "var(--color-error)",
              cursor: "pointer",
              marginBottom: 2,
            }}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      ))}
      <Button variant="secondary" onClick={addCustomLink}>
        + הוספת קישור
      </Button>

      <div className="settings__save-row" style={{ marginTop: 14 }}>
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
