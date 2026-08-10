import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Input from "../components/Input";
import ErrorMessage from "../components/ErrorMessage";
import PullToRefresh from "../components/PullToRefresh";
import {
  requestVendorPasswordReset,
  resetVendorPassword,
} from "../services/vendorsService";
import "../styles/login.css";

/*
  SupplierForgotPasswordPage — איפוס סיסמה לספק בשני שלבים, בעיצוב זהה למסך
  הכניסה: שלב 1 — מזינים מייל → נשלח קוד חד-פעמי בן 6 ספרות; שלב 2 — מזינים
  את הקוד וסיסמה חדשה. מטעמי אבטחה לא חושפים אם המייל רשום — תמיד עוברים לשלב 2.
*/
function SupplierForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request"); // request | reset
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleRequest(event) {
    event.preventDefault();
    setSubmitError("");
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrors({ email: "כתובת המייל אינה תקינה" });
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await requestVendorPasswordReset(trimmed);
      setStep("reset");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReset(event) {
    event.preventDefault();
    setSubmitError("");
    const next = {};
    if (!code.trim()) next.code = "צריך להזין את הקוד שקיבלת במייל";
    if (!newPassword || newPassword.length < 8)
      next.newPassword = "הסיסמה חייבת להכיל לפחות 8 תווים";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }
    setIsSubmitting(true);
    try {
      await resetVendorPassword({
        loginEmail: email.trim(),
        code: code.trim(),
        newPassword,
      });
      setDone(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      {/* משיכה למטה לרענון הדף (נייד) */}
      <PullToRefresh />
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
          {done ? (
            <>
              <h2 className="login-card__title">הסיסמה אופסה בהצלחה 🎉</h2>
              <p className="auth-page__hint" style={{ margin: "0 0 14px" }}>
                אפשר להיכנס עכשיו עם הסיסמה החדשה שלך.
              </p>
              <div className="auth-page__actions">
                <Button onClick={() => navigate("/supplier-login")}>
                  לכניסת ספקים
                </Button>
              </div>
            </>
          ) : step === "request" ? (
            <>
              <h2 className="login-card__title">שכחת סיסמה?</h2>
              <p className="auth-page__hint" style={{ margin: "0 0 14px" }}>
                הזינו את המייל שהגדרתם, ונשלח אליו קוד חד-פעמי לאיפוס הסיסמה.
              </p>
              <form onSubmit={handleRequest} noValidate>
                <Input
                  id="sfp-email"
                  label="כתובת המייל שלך"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  placeholder="you@example.com"
                />
                {submitError && <ErrorMessage message={submitError} />}
                <div className="auth-page__actions">
                  <Button type="submit" isLoading={isSubmitting}>
                    שלחו לי קוד
                  </Button>
                </div>
                <p className="auth-page__hint">
                  <Link to="/supplier-login">חזרה לכניסה</Link>
                </p>
              </form>
            </>
          ) : (
            <>
              <h2 className="login-card__title">הזנת הקוד וסיסמה חדשה</h2>
              <p className="auth-page__hint" style={{ margin: "0 0 12px" }}>
                במידה והמייל שלך רשום במערכת — מחכה לך קוד בן 6 ספרות לאיפוס
                הסיסמה. הקוד תקף ל-5 דקות, וכדאי לבדוק גם בתיקיית הספאם 🙂
              </p>
              <form onSubmit={handleReset} noValidate>
                <Input
                  id="sfp-code"
                  label="הקוד מהמייל"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  error={errors.code}
                />
                <div className="password-field">
                  <Input
                    id="sfp-password"
                    label="סיסמה חדשה (8 תווים לפחות)"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    error={errors.newPassword}
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
                    איפוס הסיסמה
                  </Button>
                </div>
                <p className="auth-page__hint">
                  <button
                    type="button"
                    className="pw-suggest"
                    onClick={() => {
                      setStep("request");
                      setSubmitError("");
                      setErrors({});
                    }}
                  >
                    לא קיבלת קוד? חזרה לשליחה חוזרת
                  </button>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupplierForgotPasswordPage;
