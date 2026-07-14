import { useState } from "react";
import Card from "../../components/Card";
import PasswordField from "../../components/PasswordField";
import Button from "../../components/Button";
import { changePassword, getUser } from "../../services/authService";

/*
  ChangePasswordCard — שינוי סיסמה מתוך ההגדרות: הסיסמה הנוכחית + חדשה.
  השרת מאמת את הנוכחית ומחליף; הודעת הצלחה/שגיאה מוצגת כאן.
*/
function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!current) {
      setError("יש להזין את הסיסמה הנוכחית");
      return;
    }
    if (next.length < 6) {
      setError("הסיסמה החדשה חייבת להכיל לפחות 6 תווים");
      return;
    }
    setIsSaving(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setSuccess("הסיסמה שונתה בהצלחה ✅");
      setCurrent("");
      setNext("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card title="🔑 שינוי סיסמה">
      <form onSubmit={handleSubmit} noValidate>
        {/* שם המשתמש (נסתר) — עוזר למנהל הסיסמאות של הדפדפן לשייך את העדכון לחשבון */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={getUser()?.username || ""}
          readOnly
          aria-hidden="true"
          tabIndex={-1}
          style={{ display: "none" }}
        />
        <PasswordField
          id="current-password"
          label="הסיסמה הנוכחית"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <PasswordField
          id="new-password"
          label="סיסמה חדשה"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        {error && <p className="settings__error">{error}</p>}
        {success && <p className="settings__success">{success}</p>}
        <div style={{ marginTop: 10 }}>
          <Button type="submit" isLoading={isSaving}>
            שמירת הסיסמה
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default ChangePasswordCard;
