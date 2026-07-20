import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import ErrorMessage from "../components/ErrorMessage";
import { formatShekels } from "../services/format";
import { confirmMockPayment } from "../services/cardPaymentService";
import "../styles/checkout.css";

/*
  CardReturnPage (/pay/return) — עמוד החזרה מסליקת האשראי. ציבורי, כי ההורה
  שמשלם אינו מחובר לאפליקציה.
  - סימולטור (mock=1): מדמה את עמוד הספק — "אשר/בטל"; אישור שולח webhook שמסמן "שולם".
  - פרודקשן: הספק כבר סימן "שולם" (webhook שרת-לשרת), וכאן רק מציגים תודה.
*/
function CardReturnPage() {
  const [params] = useSearchParams();
  const transactionRef = params.get("ref") || "";
  const amount = Number(params.get("amount")) || 0;
  const isMock = params.get("mock") === "1";

  const [status, setStatus] = useState("pending"); // pending | paid
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");

  async function approve() {
    setError("");
    setIsPaying(true);
    try {
      await confirmMockPayment(transactionRef, amount);
      setStatus("paid");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPaying(false);
    }
  }

  // בפרודקשן (לא סימולטור) הספק כבר טיפל בתשלום — מציגים ישר תודה.
  const showSuccess = status === "paid" || !isMock;

  if (showSuccess) {
    return (
      <div className="checkout">
        <Card>
          <div className="checkout__success">
            <div className="checkout__success-icon" aria-hidden="true">
              ✅
            </div>
            <h2>התשלום התקבל, תודה!</h2>
            <p className="checkout__paid-amount">{formatShekels(amount)}</p>
            {isMock && (
              <p className="checkout__demo-note">
                הדגמה — לא בוצע חיוב אמיתי. סליקה אמיתית תתחבר עם מפתחות הספק.
              </p>
            )}
            <Link to="/" className="checkout__back">
              <Button variant="secondary">חזרה לאפליקציה</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // סימולטור — "עמוד הספק" המדומה, לפני אישור
  return (
    <div className="checkout">
      <Card>
        <p className="checkout__demo-banner">
          🔧 עמוד תשלום לדוגמה (סימולטור). בפרודקשן זה יהיה עמוד מאובטח של ספק
          הסליקה, וההורה יקליד שם את פרטי הכרטיס — לעולם לא באפליקציה שלנו.
        </p>
        <div className="checkout__summary">
          <span className="checkout__for">תשלום באשראי</span>
          <span className="checkout__amount">{formatShekels(amount)}</span>
        </div>
        {error && <ErrorMessage message={error} />}
        <div className="form-actions">
          <Button onClick={approve} isLoading={isPaying}>
            {`אשר תשלום ${formatShekels(amount)}`}
          </Button>
          <Link to="/" className="checkout__back">
            <Button variant="secondary">ביטול</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default CardReturnPage;
