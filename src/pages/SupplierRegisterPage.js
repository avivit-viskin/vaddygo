import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Input from "../components/Input";
import ErrorMessage from "../components/ErrorMessage";
import SupportLink from "../components/SupportLink";
import { registerVendor } from "../services/vendorsService";
import "../styles/login.css";

/*
  SupplierRegisterPage — הרשמת ספק חדש בעצמו (פורטל ספקים). ציבורי ובמסך מלא,
  בעיצוב מסך הכניסה: שם עסק + מייל + סיסמה. אחרי הרשמה מוצלחת ממשיכים ישר
  לעמוד העריכה של הספק כדי למלא את הכרטיס והמוצרים.
*/
function SupplierRegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
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
    if (!name.trim()) next.name = "צריך שם עסק/ספק";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim()))
      next.loginEmail = "כתובת המייל אינה תקינה";
    if (!password || password.length < 6)
      next.password = "הסיסמה חייבת להכיל לפחות 6 תווים";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await registerVendor({
        name: name.trim(),
        loginEmail: loginEmail.trim(),
        password,
      });
      navigate(`/supplier/${token}`);
    } catch (err) {
      setSubmitError(err.message || "לא הצלחנו להשלים את ההרשמה. אפשר לנסות שוב.");
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
          <h2 className="login-card__title">הרשמת ספק חדש 🙂</h2>
          <p className="auth-page__hint" style={{ margin: "0 0 14px" }}>
            פותחים חשבון עם מייל וסיסמה, וממשיכים למלא את הכרטיס והמוצרים שלכם —
            והם יופיעו מיד לוועדי ההורים ב-VaddyGo.
          </p>
          <form onSubmit={handleSubmit} noValidate>
            <Input
              id="reg-name"
              label="שם העסק / הספק"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="למשל: מתנות בלב"
            />
            <Input
              id="reg-email"
              label="מייל"
              type="email"
              autoComplete="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              error={errors.loginEmail}
              placeholder="you@example.com"
            />
            <div className="password-field">
              <Input
                id="reg-password"
                label="סיסמה (6 תווים לפחות)"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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
                הרשמה והמשך למילוי הכרטיס
              </Button>
            </div>
            <p className="auth-page__hint">
              כבר יש לך חשבון? <Link to="/supplier-login">לכניסת ספקים</Link>
            </p>
          </form>
        </div>
        <SupportLink />
      </div>
    </div>
  );
}

export default SupplierRegisterPage;
