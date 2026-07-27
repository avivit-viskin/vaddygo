import { useCallback, useState } from "react";
import { useParams, Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import {
  getVendorByToken,
  updateVendorByToken,
  setVendorCredentials,
} from "../services/vendorsService";
import VendorForm from "./gifts/VendorForm";
import VendorPanel from "./gifts/VendorPanel";
import Logo from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import "../styles/gifts.css";

/*
  SupplierEditPage — עמוד עריכה עצמית לספק (פורטל ספקים). ציבורי ובמסך מלא.
  בראש העמוד — הגדרת כניסה קבועה (מייל+סיסמה), כדי שהספק יוכל לחזור בלי הקישור.
  מתחת — עריכת הכרטיס והמוצרים שהוועדים רואים ב-VaddyGo. הטוקן שבכתובת הוא ההרשאה.
*/
function SupplierEditPage() {
  const { token } = useParams();
  const fetcher = useCallback(() => getVendorByToken(token), [token]);
  const { data: vendor, isLoading, error, reload } = useApi(fetcher);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  // "edit" = טופס העריכה; "preview" = תצוגה כמו שהוועד רואה באפליקציה
  const [mode, setMode] = useState("edit");
  // הנתונים לתצוגה המקדימה (מתעדכנים בכל שמירה); לפני שמירה — מה שנטען
  const [previewVendor, setPreviewVendor] = useState(null);
  // הגדרת התחברות — מייל+סיסמה כדי לחזור בלי הקישור
  const [credEmail, setCredEmail] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credMsg, setCredMsg] = useState(null);
  const [credSaving, setCredSaving] = useState(false);

  async function handleSave(payload) {
    setSaveError("");
    setSaved(false);
    try {
      await updateVendorByToken(token, payload);
      setPreviewVendor(payload); // התצוגה המקדימה תשקף את מה שנשמר
      setSaved(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSaveError(err.message || "לא הצלחנו לשמור. אפשר לנסות שוב בעוד רגע.");
    }
  }

  async function saveCredentials(event) {
    event.preventDefault();
    setCredMsg(null);
    setCredSaving(true);
    try {
      await setVendorCredentials(token, {
        loginEmail: credEmail.trim(),
        password: credPassword,
      });
      setCredMsg({ ok: true, text: "מעכשיו אפשר להתחבר עם המייל והסיסמה האלה" });
      setCredPassword("");
    } catch (err) {
      setCredMsg({
        ok: false,
        text: err.message || "לא הצלחנו לשמור את פרטי ההתחברות",
      });
    } finally {
      setCredSaving(false);
    }
  }

  if (isLoading) {
    return <Spinner text="טוען את כרטיס הספק..." />;
  }

  if (error) {
    return (
      <div className="supplier-edit">
        <ErrorMessage
          message="הקישור אינו תקין או שכבר אינו בתוקף. אפשר לבקש קישור חדש מהוועד."
          onRetry={reload}
        />
      </div>
    );
  }

  return (
    <div className="supplier-edit" dir="rtl">
      <div className="supplier-edit__brand">
        <Logo />
      </div>
      <h1 className="supplier-edit__title">אזור הספק שלך</h1>
      <p className="supplier-edit__intro">שלום {vendor.name || "ספק יקר"} 👋</p>

      {saved && (
        <p className="supplier-edit__saved" role="status">
          ✓ הפרטים נשמרו — כבר מעודכנים אצל הוועדים
        </p>
      )}
      {saveError && (
        <p className="field__error" role="alert">
          {saveError}
        </p>
      )}

      {/* ── כניסה קבועה — מוצג רק כשעדיין לא הוגדרו פרטי כניסה (הקישור הראשון
          ששולחים לספק). אחרי שהספק הגדיר/התחבר (hasLogin) — הכרטיס מוסתר. ── */}
      {!vendor?.hasLogin && (
      <form
        className="supplier-edit__login"
        onSubmit={saveCredentials}
        noValidate
        style={{
          marginTop: 4,
          paddingTop: 16,
          border: "1px solid var(--color-primary)",
          borderRadius: "var(--radius-md)",
          padding: 16,
          background: "var(--color-primary-light)",
        }}
      >
        <h2 className="supplier-edit__login-title">
          🔑 הגדרת כניסה קבועה — מייל וסיסמה
        </h2>
        <p className="supplier-edit__login-hint">
          קבעו מייל וסיסמה, וכך תוכלו לחזור ולעדכן בכל עת דרך עמוד כניסת הספקים —
          בלי הקישור.
        </p>
        <Input
          id="cred-email"
          label="מייל"
          type="email"
          value={credEmail}
          onChange={(e) => setCredEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Input
          id="cred-password"
          label="סיסמה (6 תווים לפחות)"
          type="password"
          value={credPassword}
          onChange={(e) => setCredPassword(e.target.value)}
        />
        {credMsg && (
          <p
            className={credMsg.ok ? "supplier-edit__saved" : "field__error"}
            role={credMsg.ok ? "status" : "alert"}
          >
            {credMsg.ok ? "✓ " : ""}
            {credMsg.text}
          </p>
        )}
        <Button type="submit" isLoading={credSaving}>
          שמירת פרטי כניסה
        </Button>
        <p className="supplier-edit__login-link">
          כבר הגדרתם? <Link to="/supplier-login">כניסת ספקים ←</Link>
        </p>
      </form>
      )}

      {/* ── עריכת הכרטיס והמוצרים ── */}
      <h2
        className="supplier-edit__title"
        style={{ margin: "28px 0 4px", fontSize: "var(--font-size-lg)" }}
      >
        הכרטיס והמוצרים שלך
      </h2>
      <p className="supplier-edit__intro" style={{ margin: "0 0 14px" }}>
        כל שינוי שתשמרו יופיע <strong>מיד</strong> לוועדים ב-VaddyGo.
      </p>

      <div className="supplier-edit__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "edit"}
          className={`supplier-edit__tab${
            mode === "edit" ? " supplier-edit__tab--active" : ""
          }`}
          onClick={() => setMode("edit")}
        >
          ✏️ עריכה
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "preview"}
          className={`supplier-edit__tab${
            mode === "preview" ? " supplier-edit__tab--active" : ""
          }`}
          onClick={() => setMode("preview")}
        >
          👁 כך הוועד רואה
        </button>
      </div>

      {mode === "preview" ? (
        <div className="supplier-edit__preview">
          <p className="supplier-edit__preview-hint">
            כך נראה הכרטיס שלך לוועדים באפליקציה (לפי מה שכבר נשמר). אפשר ללחוץ
            על תיקייה כדי לראות את המוצרים שבתוכה.
          </p>
          <VendorPanel vendor={previewVendor || vendor} readOnly />
        </div>
      ) : (
        <VendorForm vendor={vendor} onSave={handleSave} />
      )}
    </div>
  );
}

export default SupplierEditPage;
