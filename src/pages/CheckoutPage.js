import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import useForm from "../hooks/useForm";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { formatShekels } from "../services/format";
import "../styles/checkout.css";

/*
  CheckoutPage — מסך תשלום (דמו). מציג סכום וטופס כרטיס אשראי ומדמה תשלום מוצלח,
  אבל אינו מחייב באמת ואינו שולח/שומר את פרטי הכרטיס בשום מקום — placeholder עד
  שתחובר סליקה אמיתית. הסכום והתיאור מגיעים מפרמטרים בכתובת (?amount=&for=).
*/
function validateCard(values) {
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
  const amount = Number(params.get("amount")) || 500;
  const description = params.get("for") || "דמי ועד";

  const [isPaid, setIsPaid] = useState(false);
  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm(
    { holder: "", card: "", expiry: "", cvv: "" },
    validateCard
  );

  // דמו בלבד: אין חיוב אמיתי ואין שליחת נתונים — רק המתנה קצרה ואז "הצלחה".
  async function pay() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsPaid(true);
  }

  if (isPaid) {
    return (
      <div className="checkout">
        <Card>
          <div className="checkout__success">
            <div className="checkout__success-icon" aria-hidden="true">
              ✅
            </div>
            <h2>התשלום התקבל בהצלחה!</h2>
            <p className="checkout__paid-amount">{formatShekels(amount)}</p>
            <p className="checkout__demo-note">
              הדגמה — לא בוצע חיוב אמיתי. סליקה אמיתית תחובר בהמשך.
            </p>
            <Link to="/" className="checkout__back">
              <Button variant="secondary">חזרה לבית</Button>
            </Link>
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
