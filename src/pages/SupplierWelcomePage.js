import { useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import SupportLink from "../components/SupportLink";
import "../styles/onboarding.css";

/*
  SupplierWelcomePage — מסך הפתיחה של פורטל הספקים, בעיצוב מסך הפתיחה של האתר
  (welcome / onboarding.css): לוגו, שם המערכת, ורקע בועות עדין. זו דלת הכניסה
  לספקים — מי שכבר הגדיר מייל+סיסמה נכנס מכאן; ספק חדש מקבל קישור אישי מהוועד.
*/
function SupplierWelcomePage() {
  const navigate = useNavigate();

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
          <Button onClick={() => navigate("/supplier-login")}>
            כניסה עם מייל וסיסמה
          </Button>
          <Button variant="secondary" onClick={() => navigate("/login")}>
            חבר/ת ועד? לכניסת הוועד
          </Button>
        </div>
        <p className="welcome__text">
          קיבלתם קישור אישי מהוועד? פשוט פִּתחו אותו כדי לערוך — ותוכלו להגדיר שם
          מייל וסיסמה לכניסה מהירה בפעם הבאה.
        </p>
        <SupportLink />
      </div>
    </div>
  );
}

export default SupplierWelcomePage;
