import { useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import SupportLink from "../components/SupportLink";
import "../styles/onboarding.css";

/*
  WelcomePage — מסך הפתיחה לפי UI_SPEC סעיף 1.
  לפי החלטת בעלת המוצר (19.07.2026): מסך הפתיחה נשאר נקי — לוגו + כפתורים בלבד.
  הטקסט הרגשי ("אנחנו יודעים כמה שעות...") עבר לפופאפ הברוכים-הבאים שקופץ
  בכניסה הראשונה לאפליקציה (WelcomePopup).
*/
function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="welcome">
      {/* בועות שקופות עדינות שעולות ברקע — תנועה עדינה עדינה */}
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
        <p className="welcome__tagline">ארגון חכם. ניהול מנצח.</p>
        <div className="welcome__actions">
          <Button onClick={() => navigate("/register")}>שנתחיל?</Button>
          <Button variant="secondary" onClick={() => navigate("/login")}>
            כבר יש לי חשבון — כניסה
          </Button>
        </div>
        <SupportLink />
      </div>
    </div>
  );
}

export default WelcomePage;
