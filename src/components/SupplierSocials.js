import { useState } from "react";
import Input from "./Input";
import Button from "./Button";
import "../styles/supplier-socials.css";

/*
  SupplierSocials — הרשתות החברתיות והקישורים של הספק. עורך מבוסס-שורות: לכל שורה
  שם רשת (עם השלמה אוטומטית — מקלידים "פייס"/"face" ומקבלים "פייסבוק") וקישור.
  onSave מקבל את מערך socialLinks המלא [{ label, url }]; ההורה ממזג ושומר (מסונכרן
  לוועד, שמציג אותם ככפתורים בכרטיס הספק).
*/

// רשתות מוכרות — להשלמה אוטומטית (עברית + אנגלית) ולרמז כתובת מתאים לכל אחת.
const NETWORKS = [
  { he: "אתר", en: "Website", hint: "https://" },
  { he: "פייסבוק", en: "Facebook", hint: "https://facebook.com/" },
  { he: "אינסטגרם", en: "Instagram", hint: "https://instagram.com/" },
  { he: "טיקטוק", en: "TikTok", hint: "https://tiktok.com/@" },
  { he: "יוטיוב", en: "YouTube", hint: "https://youtube.com/@" },
  { he: "וואטסאפ", en: "WhatsApp", hint: "https://wa.me/972" },
  { he: "טלגרם", en: "Telegram", hint: "https://t.me/" },
  { he: "לינקדאין", en: "LinkedIn", hint: "https://linkedin.com/in/" },
  { he: "פינטרסט", en: "Pinterest", hint: "https://pinterest.com/" },
  { he: "X (טוויטר)", en: "Twitter X", hint: "https://x.com/" },
];

// מזהה רשת מוכרת מטקסט חופשי (עברית/אנגלית, ללא תלות ברישיות) — כדי לשמור שם עברי
// אחיד ולהציע רמז כתובת. קודם התאמה מדויקת, אחר כך התחלה/הכלה של מה שהוקלד.
function findNetwork(label) {
  const t = (label || "").trim().toLowerCase();
  if (!t) return null;
  return (
    NETWORKS.find((n) => n.he.toLowerCase() === t || n.en.toLowerCase() === t) ||
    NETWORKS.find(
      (n) => n.he.toLowerCase().includes(t) || n.en.toLowerCase().includes(t)
    ) ||
    null
  );
}

let rowSeq = 0;
const newRow = (label = "", url = "") => ({ key: `row-${(rowSeq += 1)}`, label, url });

function SupplierSocials({ vendor, onSave }) {
  const [rows, setRows] = useState(() => {
    const existing = vendor?.socialLinks || [];
    if (existing.length) {
      return existing.map((l) => newRow(l.label || "", l.url || ""));
    }
    // ברירת מחדל: שתי שורות עם הרשתות הנפוצות, כדי שיהיה קל להתחיל
    return [newRow("פייסבוק"), newRow("אינסטגרם")];
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const setRow = (key, patch) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, newRow()]);
  const removeRow = (key) => setRows((prev) => prev.filter((r) => r.key !== key));

  async function handleSubmit(event) {
    event.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      // רק שורות עם קישור נשמרות; שם רשת מוכר מנורמל לשם העברי האחיד.
      const links = rows
        .filter((r) => r.url.trim())
        .map((r) => {
          const net = findNetwork(r.label);
          return { label: net ? net.he : r.label.trim(), url: r.url.trim() };
        });
      await onSave(links);
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
        הוסיפו קישורים לרשתות שלכם — הם יופיעו לוועד ככפתורים בכרטיס. התחילו להקליד
        שם רשת (למשל «פייס» או «face») ותקבלו השלמה אוטומטית.
      </p>

      {/* השלמה אוטומטית לשם הרשת — עברית כערך, אנגלית כתיאור (שני הכיוונים נתפסים) */}
      <datalist id="social-network-suggestions">
        {NETWORKS.map((n) => (
          <option key={n.he} value={n.he}>
            {n.en}
          </option>
        ))}
      </datalist>

      {rows.map((row) => {
        const net = findNetwork(row.label);
        return (
          <div key={row.key} className="social-row">
            <div className="social-row__name">
              <Input
                id={`social-name-${row.key}`}
                label="רשת"
                value={row.label}
                onChange={(e) => setRow(row.key, { label: e.target.value })}
                placeholder="פייסבוק / אינסטגרם…"
                list="social-network-suggestions"
                autoComplete="off"
              />
            </div>
            <div className="social-row__url">
              <Input
                id={`social-url-${row.key}`}
                label="קישור"
                type="url"
                value={row.url}
                onChange={(e) => setRow(row.key, { url: e.target.value })}
                placeholder={net ? net.hint : "https://…"}
              />
            </div>
            <div className="social-row__remove">
              <Button type="button" variant="secondary" onClick={() => removeRow(row.key)}>
                הסרה
              </Button>
            </div>
          </div>
        );
      })}

      <div className="social-add">
        <Button type="button" variant="secondary" onClick={addRow}>
          + הוספת רשת
        </Button>
      </div>

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
