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
  SupplierEditPage — עמוד עריכה עצמית לספק (פורטל ספקים, שלב 1). ציבורי ובמסך
  מלא (בלי התחברות): הספק פותח את הקישור האישי שקיבל, עורך את הכרטיס והמוצרים
  שלו, וזה נשמר לאותה רשומה שהוועדים רואים ב-VaddyGo. הטוקן שבכתובת הוא ההרשאה.
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
  // הגדרת התחברות (אופציונלי) — מייל+סיסמה כדי לחזור בלי הקישור
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
      <h1 className="supplier-edit__title">עריכת כרטיס הספק שלך</h1>
      <p className="supplier-edit__intro">
        שלום {vendor.name || "ספק יקר"} 👋 כאן אפשר לעדכן את הפרטים והמוצרים שלך.
        כל שינוי שתשמרו יופיע <strong>מיד</strong> לוועדים ב-VaddyGo.
      </p>

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
        <>
          <VendorForm vendor={vendor} onSave={handleSave} />

          <form
            className="supplier-edit__login"
            onSubmit={saveCredentials}
            noValidate
          >
            <h2 className="supplier-edit__login-title">
              כניסה מהירה בפעם הבאה (לא חובה)
            </h2>
            <p className="supplier-edit__login-hint">
              הגדירו מייל וסיסמה — וכך תוכלו לחזור ולעדכן בלי הקישור, דרך עמוד
              כניסת הספקים.
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
            <Button type="submit" variant="secondary" isLoading={credSaving}>
              שמירת פרטי התחברות
            </Button>
            <p className="supplier-edit__login-link">
              כבר הגדרתם מייל וסיסמה?{" "}
              <Link to="/supplier-login">כניסת ספקים ←</Link>
            </p>
          </form>
        </>
      )}
    </div>
  );
}

export default SupplierEditPage;
