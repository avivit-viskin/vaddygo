import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import "../styles/onboarding.css";

/*
  LoginPage — מסך כניסה לפי UI_SPEC סעיף 2.
  בשלב זה UI בלבד: אימות אמיתי (סיסמאות, JWT, כניסה עם Google) מגיע
  בשלב 10 של ה-ROADMAP. עד אז "כניסה" מעבירה פנימה כדי שאפשר לחוות את המסכים.
*/
function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!email.trim()) next.email = "צריך למלא כתובת מייל";
    if (!password) next.password = "צריך למלא סיסמה";
    setErrors(next);
    if (Object.keys(next).length === 0) {
      navigate("/");
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
            id="login-email"
            label="כתובת מייל"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
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
          <div className="auth-page__actions">
            <Button type="submit">כניסה</Button>
            <Button variant="secondary" disabled>
              כניסה עם Google
            </Button>
          </div>
          <p className="auth-page__hint">
            שכחתי סיסמה · כניסה עם Google — יופעלו בשלב האבטחה (שלב 10)
          </p>
          <p className="auth-page__hint">
            עדיין אין לך חשבון? <Link to="/onboarding">להרשמה מהירה</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
