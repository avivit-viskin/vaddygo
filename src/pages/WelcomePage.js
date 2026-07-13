import { useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import "../styles/onboarding.css";

/*
  WelcomePage — מסך הפתיחה לפי UI_SPEC סעיף 1.
  נוסח הטקסט קבוע מהאפיון של בעלת המוצר — לא משנים בלי אישור.
*/
function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="welcome">
      <h1 className="welcome__logo">
        <BrandName />
      </h1>
      <p className="welcome__text">
        ברוכים הבאים למשפחת <BrandName />! אנחנו יודעים כמה שעות אתם משקיעים —
        בלי תודה, בלי שכר, רק מתוך אהבה.
      </p>
      <p className="welcome__text">
        עכשיו <BrandName /> לוקחת את העומס מהכתפיים שלכם: הגבייה קלה, יש
        שקיפות — ואתם סוף־סוף יכולים לנשום.
      </p>
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
