import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import ErrorMessage from "../components/ErrorMessage";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { login, loginWithGoogle } from "../services/authService";
import "../styles/onboarding.css";

/*
  LoginPage — מסך כניסה למנוי רשום (UI_SPEC ס' 2): שם משתמש/מייל + סיסמה.
  מתחבר ל-`POST /api/auth/login`, שומר את ה-token וממשיך פנימה.
  "כניסה עם Google" עדיין מושבתת — תופעל כשייבנה זרם ה-OAuth בשרת.
*/
function LoginPage() {
  const navigate = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // כניסה עם Google — יציב (useCallback) כדי לא לאתחל את כפתור גוגל שוב ושוב
  const handleGoogle = useCallback(
    async (credential) => {
      setSubmitError("");
      try {
        await loginWithGoogle(credential);
        navigate("/");
      } catch (err) {
        if (err.message && err.message.includes("המנוי פג")) {
          navigate("/subscription-expired");
        } else {
          setSubmitError(err.message);
        }
      }
    },
    [navigate]
  );

  const handleGoogleError = useCallback(() => {
    setSubmitError("לא הצלחנו לטעון את כניסת Google. נסי שוב או השתמשי בשם משתמש וסיסמה.");
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    const next = {};
    if (!usernameOrEmail.trim()) next.usernameOrEmail = "צריך למלא שם משתמש או מייל";
    if (!password) next.password = "צריך למלא סיסמה";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ usernameOrEmail: usernameOrEmail.trim(), password });
      navigate("/");
    } catch (err) {
      // מנוי שפג — מסך ייעודי במקום הודעת שגיאה מבלבלת
      if (err.message && err.message.includes("המנוי פג")) {
        navigate("/subscription-expired");
      } else {
        setSubmitError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <h1 className="auth-page__logo">
        <BrandName withHeart />
      </h1>
      <Card title="שמחים לראות אותך שוב 🙂">
        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="login-identifier"
            label="שם משתמש או מייל"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            error={errors.usernameOrEmail}
          />
          <div className="password-field">
            <Input
              id="login-password"
              label="סיסמה"
              type={showPassword ? "text" : "password"}
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
          <div className="auth-divider">או</div>
          <div className="google-signin-wrap">
            <GoogleSignInButton
              onCredential={handleGoogle}
              onError={handleGoogleError}
            />
          </div>
          <p className="auth-page__hint">
            עדיין אין לך חשבון? <Link to="/register">להרשמה מהירה</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
