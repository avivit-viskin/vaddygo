import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Input from "../components/Input";
import ErrorMessage from "../components/ErrorMessage";
import SupportLink from "../components/SupportLink";
import { supplierLogin } from "../services/vendorsService";
import "../styles/login.css";

/*
  SupplierLoginPage — כניסת ספקים (פורטל ספקים). ציבורי ובמסך מלא, בעיצוב זהה
  למסך הכניסה הראשי של האתר: מייל + סיסמה שהספק הגדיר בעמוד העריכה, עם אפשרות
  "שכחתי סיסמה". התחברות מוצלחת מחזירה את טוקן העריכה ומפנה לעמוד העריכה של הספק.
*/
function SupplierLoginPage() {
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    const next = {};
    if (!loginEmail.trim()) next.loginEmail = "צריך למלא מייל";
    if (!password) next.password = "צריך למלא סיסמה";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await supplierLogin({
        loginEmail: loginEmail.trim(),
        password,
      });
      navigate(`/supplier/${token}`);
    } catch (err) {
      setSubmitError(err.message || "מייל או סיסמה שגויים");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-bg" aria-hidden="true">
        <span className="login-blob login-blob--1" />
        <span className="login-blob login-blob--2" />
        <span className="login-blob login-blob--3" />
      </div>

      <div className="login-screen__content">
        <header className="login-hero">
          <h1 className="login-hero__brand">
            <BrandName />
          </h1>
          <p className="login-hero__tagline">פורטל הספקים</p>
        </header>

        <div className="login-card">
          <h2 className="login-card__title">כניסת ספקים 🙂</h2>
          <p className="auth-page__hint" style={{ margin: "0 0 14px" }}>
            התחברו עם המייל והסיסמה שהגדרתם בעמוד העריכה, כדי לעדכן את הכרטיס
            והמוצרים שלכם.
          </p>
          <form onSubmit={handleSubmit} noValidate>
            <Input
              id="supplier-email"
              label="מייל"
              type="email"
              autoComplete="username"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              error={errors.loginEmail}
              placeholder="you@example.com"
            />
            <div className="password-field">
              <Input
                id="supplier-password"
                label="סיסמה"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
              <button
                type="button"
                className="password-field__eye"
                aria-label={showPassword ? "הסתרת סיסמה" : "הצגת סיסמה"}
                onClick={() => setShowPassword((s) => !s)}
              >
                👁
              </button>
            </div>
            {submitError && <ErrorMessage message={submitError} />}
            <div className="auth-page__actions">
              <Button type="submit" isLoading={isSubmitting}>
                כניסה
              </Button>
            </div>
            <p className="auth-page__hint">
              <Link to="/supplier-forgot-password">
                שכחת סיסמה? נשלח לך קוד למייל
              </Link>
            </p>
          </form>
        </div>
        <SupportLink />
      </div>
    </div>
  );
}

export default SupplierLoginPage;
