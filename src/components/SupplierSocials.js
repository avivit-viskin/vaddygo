import { useState } from "react";
import Input from "./Input";
import Button from "./Button";

/*
  SupplierSocials — דף הרשתות החברתיות והקישורים של הספק: אתר, פייסבוק, אינסטגרם,
  טיקטוק (וגם קישורים נוספים אם יש). מוצג לוועד ככפתורים בכרטיס הספק. onSave מקבל
  את מערך socialLinks המלא; ההורה ממזג לכרטיס המלא ושומר (מסונכרן לוועד).
*/
const PLATFORMS = [
  { key: "website", label: "אתר", placeholder: "https://..." },
  { key: "facebook", label: "פייסבוק", placeholder: "https://facebook.com/..." },
  { key: "instagram", label: "אינסטגרם", placeholder: "https://instagram.com/..." },
  { key: "tiktok", label: "טיקטוק", placeholder: "https://tiktok.com/@..." },
];

function matchesPlatform(link, platform) {
  const label = (link.label || "").trim().toLowerCase();
  return label === platform.label.toLowerCase() || label === platform.key;
}

function SupplierSocials({ vendor, onSave }) {
  const existing = vendor?.socialLinks || [];
  const [links, setLinks] = useState(() => {
    const initial = {};
    PLATFORMS.forEach((p) => {
      const found = existing.find((l) => matchesPlatform(l, p));
      initial[p.key] = found?.url || "";
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const platformLinks = PLATFORMS.filter((p) => links[p.key].trim()).map(
        (p) => ({ label: p.label, url: links[p.key].trim() })
      );
      // שומרים גם קישורים נוספים שאינם אחת מהפלטפורמות המוכרות
      const others = existing.filter(
        (l) => !PLATFORMS.some((p) => matchesPlatform(l, p))
      );
      await onSave([...platformLinks, ...others]);
      setMsg({ ok: true, text: "הרשתות החברתיות נשמרו" });
    } catch (err) {
      setMsg({ ok: false, text: err.message || "לא הצלחנו לשמור. נסו שוב." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="supplier-edit__login-hint">
        הוסיפו קישורים לרשתות שלכם — הם יופיעו לוועד ככפתורים בכרטיס.
      </p>
      {PLATFORMS.map((p) => (
        <Input
          key={p.key}
          id={`social-${p.key}`}
          label={p.label}
          type="url"
          value={links[p.key]}
          onChange={(e) => setLinks((prev) => ({ ...prev, [p.key]: e.target.value }))}
          placeholder={p.placeholder}
        />
      ))}
      {msg && (
        <p
          className={msg.ok ? "supplier-edit__saved" : "field__error"}
          role={msg.ok ? "status" : "alert"}
        >
          {msg.ok ? "✓ " : ""}
          {msg.text}
        </p>
      )}
      <div className="gift-form__actions">
        <Button type="submit" isLoading={saving}>
          שמירת הרשתות
        </Button>
      </div>
    </form>
  );
}

export default SupplierSocials;
