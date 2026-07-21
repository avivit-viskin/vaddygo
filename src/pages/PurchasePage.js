import { useParams, useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Card from "../components/Card";
import { getInstitutions } from "../services/institutionsService";
import { formatShekels } from "../services/format";
import "../styles/onboarding.css";

/*
  PurchasePage — מסך רכישת מנוי למוסד נוסף (UI_SPEC ס' 3.5). מציג את מחיר המנוי
  וממשיך לתשלום; אחרי תשלום מוצלח המוסד מופעל וממשיכים לאשף ההגדרה שלו. הכסף
  כאן מגיע ל-VaddyGo (הכנסת המוצר), בשונה מכסף הגבייה שמגיע לכל ועד.
*/
// מחיר המנוי למוסד נוסף (ערך התחלתי — ניתן לשינוי בהמשך).
const SUBSCRIPTION_PRICE = 360;

function PurchasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const institution = getInstitutions().find((i) => i.id === id);

  function goToPayment() {
    const label = `מנוי VaddyGo — ${institution?.name || "מוסד חדש"}`;
    navigate(
      `/pay?amount=${SUBSCRIPTION_PRICE}&for=${encodeURIComponent(label)}&activate=${id}`
    );
  }

  return (
    <div className="auth-page">
      <h1 className="auth-page__logo">
        <BrandName withHeart />
      </h1>
      <Card title={`הפעלת המוסד "${institution?.name || "החדש"}"`}>
        <p>
          כדי לנהל מוסד נוסף צריך מנוי נפרד. אחרי התשלום נגדיר יחד את המוסד החדש
          (שם, קבוצות, גבייה) — בדיוק כמו בהרשמה הראשונה.
        </p>
        <div className="purchase__price">
          <span className="purchase__price-label">מנוי שנתי למוסד</span>
          <span className="purchase__price-amount">
            {formatShekels(SUBSCRIPTION_PRICE)}
          </span>
        </div>
        <div className="auth-page__actions">
          <Button onClick={goToPayment}>המשך לתשלום 💳</Button>
          <Button variant="secondary" onClick={() => navigate("/")}>
            חזרה
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default PurchasePage;
