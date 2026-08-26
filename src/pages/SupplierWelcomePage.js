import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import ErrorMessage from "../components/ErrorMessage";
import GoogleSignInButton from "../components/GoogleSignInButton";
import SupportLink from "../components/SupportLink";
import { supplierLoginWithGoogle } from "../services/vendorsService";
import { setSupplierSession } from "../services/supplierSession";
import ShareLinkModal from "../components/ShareLinkModal";
import "../styles/onboarding.css";

/*
  SupplierWelcomePage — מסך הפתיחה של פורטל הספקים, בעיצוב מסך הפתיחה של האתר
  (welcome / onboarding.css): לוגו, שם המערכת, ורקע בועות עדין. זו דלת הכניסה
  לספקים — הרשמה, כניסה עם מייל+סיסמה, או כניסה מהירה עם Google (כמו בוועד).
*/
function SupplierWelcomePage() {
  const navigate = useNavigate();
  const [googleError, setGoogleError] = useState("");
  const [shareOpen, setShareOpen] = useState(false);

  // כניסה מהירה עם Google — לספק שכבר קיים (מייל ההתחברות שלו הוא חשבון הגוגל).
  // useCallback יציב כדי לא לאתחל את כפתור גוגל שוב ושוב.
  const handleGoogle = useCallback(
    async (credential) => {
      setGoogleError("");
      try {
        const token = await supplierLoginWithGoogle(credential);
        setSupplierSession(token);
        navigate(`/supplier/${token}`);
      } catch (err) {
        setGoogleError(err.message || "לא הצלחנו להתחבר עם Google");
      }
    },
    [navigate]
  );
  const handleGoogleError = useCallback(() => {
    setGoogleError(
      "לא הצלחנו לטעון את כניסת Google. אפשר להיכנס עם מייל וסיסמה."
    );
  }, []);

  return (
    <div className="welcome">
      {/* בועות שקופות עדינות שעולות ברקע — כמו במסך הפתיחה של האתר */}
      <div className="welcome__bubbles" aria-hidden="true">
        <span className="welcome__bubble welcome__bubble--1" />
        <span className="welcome__bubble welcome__bubble--2" />
        <span className="welcome__bubble welcome__bubble--3" />
        <span className="welcome__bubble welcome__bubble--4" />
        <span className="welcome__bubble welcome__bubble--5" />
        <span className="welcome__bubble welcome__bubble--6" />
      </div>

      <div className="welcome__content">
        <h1 className="welcome__logo">
          <BrandName />
        </h1>
        <p className="welcome__tagline">פורטל הספקים</p>
        <p className="welcome__text">
          כאן מעדכנים את הכרטיס והמוצרים שמוצגים לוועדי ההורים ב-VaddyGo.
        </p>
        <div className="welcome__actions">
          <Button onClick={() => navigate("/supplier-register")}>
            הרשמת ספק חדש
          </Button>
          <Button variant="secondary" onClick={() => navigate("/supplier-login")}>
            כבר רשומים? כניסה
          </Button>
        </div>

        {/* כניסה מהירה עם Google — כמו בכניסת הוועד */}
        <div className="auth-divider">או</div>
        <div className="google-signin-wrap">
          <GoogleSignInButton
            onCredential={handleGoogle}
            onError={handleGoogleError}
          />
        </div>
        {googleError && <ErrorMessage message={googleError} />}

        <p
          className="welcome__text"
          style={{
            margin: "16px 0 0",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-muted)",
          }}
        >
          רוצים להזמין ספק להירשם בעצמו?{" "}
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              font: "inherit",
              color: "var(--color-primary-dark)",
              fontWeight: 700,
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            שיתוף דף ההרשמה
          </button>
        </p>

        <p
          className="welcome__text"
          style={{
            margin: "12px 0 0",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-muted)",
          }}
        >
          חבר/ת ועד? <Link to="/login">לכניסת הוועד</Link>
        </p>
        <SupportLink />
      </div>

      <ShareLinkModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        url={`${window.location.origin}/suppliers`}
        title="הזמנת ספק ל-VaddyGo"
        message="מוזמנים להצטרף כספקים ל-VaddyGo — לנהל קטלוג מוצרים שוועדי הורים רואים ומזמינים ממנו:"
      />
    </div>
  );
}

export default SupplierWelcomePage;
