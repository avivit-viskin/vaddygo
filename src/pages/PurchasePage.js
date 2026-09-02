import { useParams, useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Card from "../components/Card";
import Icon from "../components/Icon";
import { getInstitutions, beginActivation } from "../services/institutionsService";
import { formatShekels } from "../services/format";
import { PRO_PRICE } from "../services/plan";
import "../styles/onboarding.css";

/*
  PurchasePage — מסך הפעלת מוסד נוסף (UI_SPEC ס' 3.5). חודש ראשון חינם (תקופת
  ניסיון); מפעילים ללא תשלום וממשיכים לאשף ההגדרה. לאחר תקופת הניסיון ייגבה
  תשלום המנוי (הכנסת VaddyGo, בשונה מכסף הגבייה שמגיע לכל ועד).
  ⏳ אכיפת סיום הניסיון והחיוב בפועל = מערכת חיוב עתידית.

  המחיר לקוח מ-PRO_PRICE (מקור אמת יחיד, ₪149/שנה) — כדי שמסך "מוסד נוסף" יציג
  בדיוק את אותו מחיר כמו עמוד השדרוג, ולא ייסחף ממנו.
*/
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
          <span className="purchase__trial-badge">
            <Icon name="gift" size={15} /> חודש ראשון חינם
          </span>
          <p className="purchase__trial-note">
            תקופת ניסיון של חודש — ללא תשלום. לאחר תקופת הניסיון ייגבה תשלום של
            כ־{formatShekels(PRO_PRICE)} לשנה.
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
