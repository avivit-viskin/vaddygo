import { useCallback, useEffect, useState } from "react";
import useApi from "../hooks/useApi";
import {
  getStudentPayments,
  buildWhatsappReminderUrl,
  buildPaymentRequestMessage,
  isCategoryFullyPaid,
  amountRemaining,
} from "../services/paymentsService";
import { getPaymentLinks } from "../services/paymentSettingsService";
import { getBankAccount } from "../services/bankAccountService";
import { startStudentCardCheckout } from "../services/cardPaymentService";
import { paymentMethodIcon } from "../services/paymentMethods";
import PaymentMethodIcon from "./PaymentMethodIcon";
import { formatShekels } from "../services/format";
import Modal from "./Modal";
import Button from "./Button";
import Spinner from "./Spinner";
import ErrorMessage from "./ErrorMessage";

/*
  PaymentRequestButton — כפתור "בקשת תשלום" לכל תלמיד. בלחיצה נפתח חלון עם
  החוב הפתוח ושלושה אמצעים: ביט / פייבוקס / מזומן. כל אמצעי פותח וואטסאפ
  להורה עם הודעה מוכנה — הסכום + קישור התשלום המתאים (או תזכורת בלבד למזומן).
  רכיב עצמאי: מנהל בעצמו את הטעינה ואת קישורי התשלום של הוועד.
*/
function PaymentRequestButton({ student }) {
  const [isOpen, setIsOpen] = useState(false);
  const fullName = `${student.firstName} ${student.lastName}`;

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        בקשת תשלום 💸
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`בקשת תשלום — ${fullName}`}
      >
        {isOpen && <PaymentRequestContent student={student} fullName={fullName} />}
      </Modal>
    </>
  );
}

function PaymentRequestContent({ student, fullName }) {
  const fetcher = useCallback(
    () => getStudentPayments(student.id),
    [student.id]
  );
  const { data: payments, isLoading, error, reload } = useApi(fetcher);
  const [links, setLinks] = useState({ bit: "", paybox: "" });
  const [cardConfigured, setCardConfigured] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState("");

  // אמצעי התשלום שהוועד הגדיר נטענים בפתיחת החלון: ביט/פייבוקס (קישורים) ואשראי
  // (חשבון בנק שהוזן). כל אמצעי מוצג רק אם הוגדר.
  useEffect(() => {
    let alive = true;
    getPaymentLinks().then((loaded) => {
      if (alive) setLinks(loaded);
    });
    getBankAccount().then((acct) => {
      if (alive) setCardConfigured(Boolean(acct?.account));
    });
    return () => {
      alive = false;
    };
  }, []);

  if (isLoading) {
    return <Spinner text="טוען את מצב התשלומים..." />;
  }
  if (error) {
    return <ErrorMessage message={error} onRetry={reload} />;
  }

  // אם עדיין לא הוגדרו סכומי גבייה (למשל דילגו על ההקמה) — אין קטגוריות כלל,
  // ואסור לכתוב "כל התשלומים שולמו". מפנים להגדיר את הגבייה קודם.
  if (!payments || payments.length === 0) {
    return (
      <p className="pay-request__hint">
        💡 עדיין לא הוגדרו סכומי גבייה. כדי לבקש תשלום, קודם צריך להגדיר את
        הגבייה ב<strong>הגדרות</strong> (בתפריט הצדדי ☰).
      </p>
    );
  }

  // "טרם שולם" = הקטגוריה לא כוסתה במלואה. תשלום חלקי עדיין נחשב חוב פתוח,
  // כדי שלא ייכתב בטעות "כל התשלומים שולמו" למי ששילם רק חלק.
  const unpaid = payments.filter((p) => !isCategoryFullyPaid(p));
  if (unpaid.length === 0) {
    return <p className="pay-request__done">כל התשלומים של {fullName} שולמו ✅</p>;
  }

  const total = unpaid.reduce((sum, p) => sum + amountRemaining(p), 0);

  const methodUrl = (method) =>
    buildWhatsappReminderUrl(
      student.parentPhoneNumber,
      buildPaymentRequestMessage(fullName, unpaid, method, links)
    );

  // אשראי: פותח תשלום לכל החוב של התלמיד ועובר ישר לוואטסאפ להורה עם הקישור
  // (כמו ביט/פייבוקס). פותחים טאב מיד בתוך הקליק כדי לא להיחסם, ומכוונים אותו
  // לוואטסאפ אחרי שהקישור נוצר.
  async function handleCard() {
    setCardError("");
    setCardLoading(true);
    const win = window.open("", "_blank");
    try {
      const url = await startStudentCardCheckout(student.id);
      const message = buildPaymentRequestMessage(fullName, unpaid, "card", {
        ...links,
        card: url,
      });
      const wa = buildWhatsappReminderUrl(student.parentPhoneNumber, message);
      if (win) {
        win.location.href = wa;
      } else {
        window.location.href = wa;
      }
    } catch (err) {
      if (win) win.close();
      setCardError(err.message || "לא הצלחנו ליצור קישור אשראי");
    } finally {
      setCardLoading(false);
    }
  }

  return (
    <div className="pay-request">
      <p className="pay-request__total">
        חוב פתוח: <strong>{formatShekels(total)}</strong>
      </p>
      <ul className="pay-request__list">
        {unpaid.map((p) => (
          <li key={p.collectionCategoryId}>
            {p.categoryName}: {formatShekels(amountRemaining(p))}
          </li>
        ))}
      </ul>

      <p className="pay-request__prompt">באיזה אמצעי לבקש מההורה לשלם?</p>
      <div className="pay-request__methods">
        {cardConfigured && (
          <div className="pay-request__method">
            <Button onClick={handleCard} isLoading={cardLoading}>
              {paymentMethodIcon("card")} אשראי
            </Button>
          </div>
        )}
        {links.bit && (
          <a
            className="pay-request__method"
            href={methodUrl("bit")}
            target="_blank"
            rel="noreferrer"
          >
            <Button><PaymentMethodIcon method="bit" /> ביט</Button>
          </a>
        )}
        {links.paybox && (
          <a
            className="pay-request__method"
            href={methodUrl("paybox")}
            target="_blank"
            rel="noreferrer"
          >
            <Button><PaymentMethodIcon method="paybox" /> פייבוקס</Button>
          </a>
        )}
        <a
          className="pay-request__method"
          href={methodUrl("cash")}
          target="_blank"
          rel="noreferrer"
        >
          <Button variant="secondary">{paymentMethodIcon("cash")} תזכורת כללית</Button>
        </a>
      </div>
      {cardError && (
        <p className="field__error" role="alert">
          {cardError}
        </p>
      )}

      {!cardConfigured && !links.bit && !links.paybox && (
        <p className="pay-request__hint">
          💡 להוספת אמצעי תשלום — אשראי (חשבון בנק), ביט או פייבוקס — אפשר להיכנס
          ל<strong>הגדרות</strong>.
        </p>
      )}
    </div>
  );
}

export default PaymentRequestButton;
