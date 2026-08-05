import { useState } from "react";
import Button from "./Button";
import ProBadge from "./ProBadge";

/*
  SupplierOffer — עורך "מבצע/הצעה מיוחדת" של הספק (פיצ'ר פרו). מה שנשמר כאן
  מוצג לוועדים בכרטיס הספק ובקטלוג. נשמר על ה-Vendor בשרת (שדה Offer).
*/
function SupplierOffer({ vendor, onSave }) {
  const [offer, setOffer] = useState(vendor?.offer || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(offer.trim());
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 14,
        background: "var(--color-surface)",
      }}
    >
      <h3 style={{ margin: "0 0 4px", fontSize: "var(--font-size-lg)" }}>
        🏷️ מבצע / הצעה מיוחדת <ProBadge title="מבצע לוועדים — פיצ'ר פרו" />
      </h3>
      <p
        style={{
          margin: "0 0 8px",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-muted)",
        }}
      >
        מה שתכתבו כאן יופיע לוועדים בכרטיס שלכם ובקטלוג — נהדר להנעה לרכישה.
      </p>
      <textarea
        className="field__input"
        rows={2}
        maxLength={200}
        placeholder="למשל: 10% הנחה על הזמנות מעל 300 ₪ עד סוף החודש!"
        value={offer}
        onChange={(e) => {
          setOffer(e.target.value);
          setSaved(false);
        }}
        style={{ marginBottom: 10, resize: "vertical" }}
      />
      <Button onClick={save} isLoading={saving}>
        {saved ? "נשמר ✓" : "שמירת המבצע"}
      </Button>
    </div>
  );
}

export default SupplierOffer;
