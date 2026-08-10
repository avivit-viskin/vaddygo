import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import useForm from "../hooks/useForm";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import Icon from "../components/Icon";
import { formatShekels } from "../services/format";
import { beginActivation } from "../services/institutionsService";
import {
  grantProLocally,
  PRO_UNLOCK_CODE,
  canUnlockProWithoutPaying,
} from "../services/plan";
import "../styles/checkout.css";

/*
  CheckoutPage — מסך תשלום (דמו). מציג סכום וטופס כרטיס אשראי ומדמה תשלום מוצלח,
  אבל אינו מחייב באמת ואינו שולח/שומר את פרטי הכרטיס בשום מקום — placeholder עד
  שתחובר סליקה אמיתית. הסכום והתיאור מגיעים מפרמטרים בכתובת (?amount=&for=).
  פתיחת פרו למנהלת: מזינים את קוד הפתיחה במקום מספר כרטיס (עד סליקה אמיתית).
*/
/*
  קוד הפתיחה תקף **רק למנהלת VaddyGo**. הקוד עצמו נארז לתוך ה-JavaScript
  הציבורי של האתר, ולכן בלי הבדיקה הזו כל לקוחה שנתקלת בו הייתה פותחת לעצמה
  פרו בחינם. אצל כל אחת אחרת הקוד מתנהג פשוט כמספר כרטיס לא תקין.
*/
const isUnlockCode = (card) =>
  canUnlockProWithoutPaying() && card.replace(/\s/g, "") === PRO_UNLOCK_CODE;

function validateCard(values) {
  // קוד פתיחת פרו — מדלגים על שאר הוולידציה (מזינים אותו במקום מספר כרטיס)
  if (isUnlockCode(values.card)) {
    return {};
  }
  const errors = {};
  if (!values.holder.trim()) {
    errors.holder = "יש להזין את שם בעל/ת הכרטיס";
  }
  if (!/^\d{16}$/.test(values.card.replace(/\s/g, ""))) {
    errors.card = "מספר כרטיס לא תקין (16 ספרות)";
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(values.expiry.trim())) {
    errors.expiry = "תוקף בפורמט MM/YY";
  }
  if (!/^\d{3,4}$/.test(values.cvv.trim())) {
    errors.cvv = "קוד CVV לא תקין";
  }
  return errors;
}

function CheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const amount = Number(params.get("amount")) || 500;
  const description = params.get("for") || "דמי ועד";
  // אם התשלום הוא על הפעלת מוסד נוסף — ממשיכים משם להגדרת המוסד
  const activateId = params.get("activate");

  function continueAfterPurchase() {
    if (activateId) {
      beginActivation(activateId);
      navigate("/onboarding");
    } else {
      navigate("/");
    }
  }

  const [isPaid, setIsPaid] = useState(false);
  const [proUnlocked, setProUnlocked] = useState(false);
  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm(
    { holder: "", card: "", expiry: "", cvv: "" },
    validateCard
  );

  // דמו בלבד: אין חיוב אמיתי ואין שליחת נתונים. קוד הפתיחה → פותח פרו מיד.
  async function pay() {
    if (isUnlockCode(values.card)) {
      grantProLocally();
      setProUnlocked(true);
      setIsPaid(true);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsPaid(true);
  }

  if (isPaid) {
    return (
      <div className="checkout">
        <Card>
          <div className="checkout__success">
            <div className="checkout__success-icon" aria-hidden="true">
              <Icon name="check-circle" size={56} />
            </div>
            {proUnlocked ? (
              <>
                <h2>מצב PRO נפתח!</h2>
                <p className="checkout__demo-note">
                  כל הכלים המתקדמים פתוחים לך עכשיו במכשיר הזה.
                </p>
                <Button onClick={() => navigate("/")}>המשך לאפליקציה</Button>
              </>
            ) : (
              <>
                <h2>התשלום התקבל בהצלחה!</h2>
                <p className="checkout__paid-amount">{formatShekels(amount)}</p>
                <p className="checkout__demo-note">
                  הדגמה — לא בוצע חיוב אמיתי. סליקה אמיתית תחובר בהמשך.
                </p>
                {activateId ? (
                  <Button onClick={continueAfterPurchase}>המשך להגדרת המוסד</Button>
                ) : (
                  <Link to="/" className="checkout__back">
                    <Button variant="secondary">חזרה לבית</Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="checkout">
      <Card>
        <p className="checkout__demo-banner">
          🔧 מסך הדגמה — התשלום עדיין לא אמיתי. סליקה תחובר בהמשך, ואף כרטיס לא
          מחויב או נשמר.
        </p>

        <div className="checkout__summary">
          <span className="checkout__for">{description}</span>
          <span className="checkout__amount">{formatShekels(amount)}</span>
        </div>

        <form onSubmit={handleSubmit(pay)} noValidate>
          <Input
            id="co-holder"
            name="holder"
            label="שם בעל/ת הכרטיס"
            value={values.holder}
            onChange={handleChange}
            error={errors.holder}
          />
          <Input
            id="co-card"
            name="card"
            label="מספר כרטיס"
            type="text"
            inputMode="numeric"
            dir="ltr"
            placeholder="0000 0000 0000 0000"
            value={values.card}
            onChange={handleChange}
            error={errors.card}
          />
          <div className="checkout__row">
            <Input
              id="co-expiry"
              name="expiry"
              label="תוקף"
              type="text"
              dir="ltr"
              placeholder="MM/YY"
              value={values.expiry}
              onChange={handleChange}
              error={errors.expiry}
            />
            <Input
              id="co-cvv"
              name="cvv"
              label="CVV"
              type="text"
              inputMode="numeric"
              dir="ltr"
              placeholder="123"
              value={values.cvv}
              onChange={handleChange}
              error={errors.cvv}
            />
          </div>

          <Button type="submit" isLoading={isSubmitting}>
            {`שלם ${formatShekels(amount)}`}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default CheckoutPage;
