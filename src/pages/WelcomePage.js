import { useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
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
      <h1 className="welcome__logo">
        <BrandName />
      </h1>
      <div className="welcome__actions">
        <Button onClick={() => navigate("/register")}>שנתחיל?</Button>
        <Button variant="secondary" onClick={() => navigate("/login")}>
          כבר יש לי חשבון — כניסה
        </Button>
      </div>
    </div>
  );
}

export default WelcomePage;
