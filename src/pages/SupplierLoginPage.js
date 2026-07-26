import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supplierLogin } from "../services/vendorsService";
import Logo from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";
import "../styles/gifts.css";

/*
  SupplierLoginPage — כניסת ספקים (פורטל ספקים, שלב 2). ציבורי ובמסך מלא.
  הספק מתחבר עם המייל+סיסמה שהגדיר בעמוד העריכה; ההתחברות מחזירה את טוקן
  העריכה, ואנחנו מפנים לעמוד העריכה שלו — בלי צורך בקישור האישי.
*/
function SupplierLoginPage() {
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const token = await supplierLogin({
        loginEmail: loginEmail.trim(),
        password,
      });
      navigate(`/supplier/${token}`);
    } catch (err) {
      setError(err.message || "מייל או סיסמה שגויים");
      setIsLoading(false);
    }
  }

  return (
    <div className="supplier-edit" dir="rtl">
      <div className="supplier-edit__brand">
        <Logo />
      </div>
      <h1 className="supplier-edit__title">כניסת ספקים</h1>
      <p className="supplier-edit__intro">
        התחברו עם המייל והסיסמה שהגדרתם, כדי לעדכן את הכרטיס והמוצרים שלכם.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <Input
          id="supplier-email"
          label="מייל"
          type="email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Input
          id="supplier-password"
          label="סיסמה"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
        <div className="gift-form__actions">
          <Button type="submit" isLoading={isLoading}>
            כניסה
          </Button>
        </div>
      </form>
    </div>
  );
}

export default SupplierLoginPage;
