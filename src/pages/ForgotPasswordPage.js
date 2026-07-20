import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import PasswordField from "../components/PasswordField";
import ErrorMessage from "../components/ErrorMessage";
import { requestPasswordReset, resetPassword } from "../services/authService";
import "../styles/onboarding.css";

/*
  ForgotPasswordPage — איפוס סיסמה בשני שלבים (UI_SPEC ס' 2):
  שלב 1: מזינים מייל → השרת שולח קוד חד-פעמי בן 6 ספרות.
  שלב 2: מזינים את הקוד וסיסמה חדשה → הסיסמה מתאפסת וחוזרים לכניסה.
  מטעמי אבטחה לא חושפים אם המייל קיים — תמיד עוברים לשלב 2.
*/
function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request"); // request | reset
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
      await requestPasswordReset(trimmed);
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
    if (!newPassword || newPassword.length < 6)
      next.newPassword = "הסיסמה חייבת להכיל לפחות 6 תווים";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword({ email: email.trim(), code: code.trim(), newPassword });
      setDone(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="auth-page">
        <h1 className="auth-page__logo">
          <BrandName withHeart />
        </h1>
        <Card title="הסיסמה אופסה בהצלחה 🎉">
          <p className="welcome-popup__text">
            אפשר להיכנס עכשיו עם הסיסמה החדשה שלך.
          </p>
          <div className="auth-page__actions">
            <Button onClick={() => navigate("/login")}>לכניסה</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <h1 className="auth-page__logo">
        <BrandName withHeart />
      </h1>

      {step === "request" ? (
        <Card title="שכחת סיסמה? נשלח לך קוד למייל">
          <form onSubmit={handleRequest} noValidate>
            <Input
              id="fp-email"
              label="כתובת המייל שלך"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            {submitError && <ErrorMessage message={submitError} />}
            <div className="auth-page__actions">
              <Button type="submit" isLoading={isSubmitting}>
                שלחו לי קוד
              </Button>
            </div>
            <p className="auth-page__hint">
              <Link to="/login">חזרה לכניסה</Link>
            </p>
          </form>
        </Card>
      ) : (
        <Card title="הזיני את הקוד וסיסמה חדשה">
          <form onSubmit={handleReset} noValidate>
            <p
              className="auth-page__hint"
              style={{ textAlign: "right", margin: "0 0 12px" }}
            >
              אם המייל שהזנת רשום אצלנו — שלחנו אליו קוד בן 6 ספרות. הקוד תקף
              ל-5 דקות. כדאי לבדוק גם בתיקיית הספאם 🙂
            </p>
            <Input
              id="fp-code"
              label="הקוד מהמייל"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={errors.code}
            />
            <PasswordField
              id="fp-password"
              name="newPassword"
              label="סיסמה חדשה"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.newPassword}
            />
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
        </Card>
      )}
    </div>
  );
}

export default ForgotPasswordPage;
