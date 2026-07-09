import { useParams, useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Card from "../components/Card";
import { getInstitutions, beginActivation } from "../services/institutionsService";
import "../styles/onboarding.css";

/*
  PurchasePage — מסך רכישה זמני להפעלת מוסד נוסף (UI_SPEC ס' 3.5).
  בשלב זה זו "רכישה" מדומה (בלי סליקת אשראי אמיתית — מחוץ לתחום כרגע):
  לחיצה מפעילה את המוסד וממשיכה לאשף ההגדרה שלו.
*/
function PurchasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const institution = getInstitutions().find((i) => i.id === id);

  function handlePurchase() {
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
          כדי לנהל מוסד נוסף צריך רכישה נפרדת. אחרי ההפעלה נגדיר יחד את המוסד
          החדש (שם, קבוצות, גבייה) — בדיוק כמו בהרשמה הראשונה.
        </p>
        <p className="purchase__note">
          💳 סליקת אשראי אמיתית תתווסף בהמשך — בשלב הזה זו הפעלה זמנית ללא תשלום.
        </p>
        <div className="auth-page__actions">
          <Button onClick={handlePurchase}>רכישה והפעלה</Button>
          <Button variant="secondary" onClick={() => navigate("/")}>
            חזרה
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default PurchasePage;
