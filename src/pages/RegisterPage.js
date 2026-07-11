import { useNavigate, Link } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import PasswordField from "../components/PasswordField";
import ErrorMessage from "../components/ErrorMessage";
import useForm from "../hooks/useForm";
import { register } from "../services/authService";
import "../styles/onboarding.css";

/*
  RegisterPage — יצירת מנוי בעת הרכישה (UI_SPEC ס' 2): הלקוח בוחר שם משתמש,
  מייל וסיסמה. אחרי הרשמה מוצלחת (השרת מגדיר תוקף עד 30.8) ממשיכים לאשף
  הגדרת הגן. תוקף המנוי מנוהל בשרת.
*/
function validate(values) {
  const errors = {};
  if (!values.username.trim() || values.username.trim().length < 3) {
    errors.username = "שם המשתמש חייב להכיל לפחות 3 תווים";
  }
  if (!values.email.trim()) {
    errors.email = "צריך למלא כתובת מייל";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "כתובת המייל אינה תקינה";
  }
  if (!values.password || values.password.length < 6) {
    errors.password = "הסיסמה חייבת להכיל לפחות 6 תווים";
  }
  return errors;
}

function RegisterPage() {
  const navigate = useNavigate();
  const { values, errors, submitError, isSubmitting, handleChange, handleSubmit } =
    useForm({ username: "", email: "", password: "" }, validate);

  const onSubmit = handleSubmit(async (formValues) => {
    await register({
      username: formValues.username.trim(),
      email: formValues.email.trim(),
      password: formValues.password,
    });
    navigate("/onboarding");
  });

  return (
    <div className="auth-page">
      <h1 className="auth-page__logo">
        <BrandName withHeart />
      </h1>
      <Card title="נעים להכיר! נפתח לך חשבון">
        <form onSubmit={onSubmit} noValidate>
          <Input
            id="register-username"
            name="username"
            label="שם משתמש"
            value={values.username}
            onChange={handleChange}
            error={errors.username}
          />
          <Input
            id="register-email"
            name="email"
            label="כתובת מייל"
            type="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />
          <PasswordField
            id="register-password"
            name="password"
            label="סיסמה"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
          />
          {submitError && <ErrorMessage message={submitError} />}
          <div className="auth-page__actions">
            <Button type="submit" isLoading={isSubmitting}>
              יצירת חשבון
            </Button>
          </div>
          <p className="auth-page__hint">
            כבר יש לך חשבון? <Link to="/login">לכניסה עם שם משתמש או Google</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default RegisterPage;
