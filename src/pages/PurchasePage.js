import { useParams, useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Card from "../components/Card";
import { getInstitutions, beginActivation } from "../services/institutionsService";
import { formatShekels } from "../services/format";
import "../styles/onboarding.css";

/*
  PurchasePage — מסך הפעלת מוסד נוסף (UI_SPEC ס' 3.5). חודש ראשון חינם (תקופת
  ניסיון); מפעילים ללא תשלום וממשיכים לאשף ההגדרה. לאחר תקופת הניסיון ייגבה
  תשלום המנוי (הכנסת VaddyGo, בשונה מכסף הגבייה שמגיע לכל ועד).
  ⏳ אכיפת סיום הניסיון והחיוב בפועל = מערכת חיוב עתידית.
*/
// מחיר המנוי לאחר תקופת הניסיון (ערך התחלתי — ניתן לשינוי).
const SUBSCRIPTION_PRICE = 249;

function PurchasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const institution = getInstitutions().find((i) => i.id === id);

  function startTrial() {
    beginActivation(id);
    navigate("/onboarding");
  }

  return (
    <div className="auth-page">
      <h1 className="auth-page__logo">
        <BrandName withHeart />
      </h1>
      <Card title={`הפעלת המוסד "${institution?.name || "החדש"}"`}>
        <p>
          מפעילים את המוסד החדש ומגדירים אותו יחד (שם, קבוצות, גבייה) — בדיוק כמו
          בהרשמה הראשונה.
        </p>
        <div className="purchase__trial">
          <span className="purchase__trial-badge">🎁 חודש ראשון חינם</span>
          <p className="purchase__trial-note">
            תקופת ניסיון של חודש — ללא תשלום. לאחר תקופת הניסיון ייגבה תשלום של
            כ־{formatShekels(SUBSCRIPTION_PRICE)}.
          </p>
        </div>
        <div className="auth-page__actions">
          <Button onClick={startTrial}>התחל חודש ניסיון חינם</Button>
          <Button variant="secondary" onClick={() => navigate("/")}>
            חזרה
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default PurchasePage;
