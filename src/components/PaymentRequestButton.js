import { useCallback, useEffect, useState } from "react";
import useApi from "../hooks/useApi";
import {
  getStudentPayments,
  buildWhatsappReminderUrl,
  buildPaymentRequestMessage,
} from "../services/paymentsService";
import {
  getPaymentLinks,
  savePaymentLinks,
} from "../services/paymentSettingsService";
import { formatShekels } from "../services/format";
import Modal from "./Modal";
import Button from "./Button";
import Input from "./Input";
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
  const [showLinks, setShowLinks] = useState(false);

  // קישורי הוועד נטענים מהשרת (עם נפילה מקומית) בפתיחת החלון
  useEffect(() => {
    let alive = true;
    getPaymentLinks().then((loaded) => {
      if (alive) setLinks(loaded);
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

  const unpaid = (payments || []).filter((p) => !p.isPaid);
  if (unpaid.length === 0) {
    return <p className="pay-request__done">כל התשלומים של {fullName} שולמו ✅</p>;
  }

  const total = unpaid.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const methodUrl = (method) =>
    buildWhatsappReminderUrl(
      student.parentPhoneNumber,
      buildPaymentRequestMessage(fullName, unpaid, method, links)
    );

  async function handleSaveLinks() {
    const saved = await savePaymentLinks(links);
    setLinks(saved);
    setShowLinks(false);
  }

  return (
    <div className="pay-request">
      <p className="pay-request__total">
        חוב פתוח: <strong>{formatShekels(total)}</strong>
      </p>
      <ul className="pay-request__list">
        {unpaid.map((p) => (
          <li key={p.collectionCategoryId}>
            {p.categoryName}: {formatShekels(p.amount)}
          </li>
        ))}
      </ul>

      <p className="pay-request__prompt">באיזה אמצעי לבקש מההורה לשלם?</p>
      <div className="pay-request__methods">
        {links.bit ? (
          <a
            className="pay-request__method"
            href={methodUrl("bit")}
            target="_blank"
            rel="noreferrer"
          >
            <Button>ביט</Button>
          </a>
        ) : (
          <Button variant="secondary" onClick={() => setShowLinks(true)}>
            ביט — הוסיפי קישור
          </Button>
        )}

        {links.paybox ? (
          <a
            className="pay-request__method"
            href={methodUrl("paybox")}
            target="_blank"
            rel="noreferrer"
          >
            <Button>פייבוקס</Button>
          </a>
        ) : (
          <Button variant="secondary" onClick={() => setShowLinks(true)}>
            פייבוקס — הוסיפי קישור
          </Button>
        )}

        <a
          className="pay-request__method"
          href={methodUrl("cash")}
          target="_blank"
          rel="noreferrer"
        >
          <Button variant="secondary">מזומן (תזכורת)</Button>
        </a>
      </div>

      <button
        type="button"
        className="pay-request__toggle"
        onClick={() => setShowLinks((v) => !v)}
      >
        ⚙️ קישורי התשלום של הוועד
      </button>
      {showLinks && (
        <div className="pay-request__links">
          <Input
            id="pay-link-bit"
            label="קישור ביט של הוועד"
            value={links.bit}
            onChange={(e) => setLinks({ ...links, bit: e.target.value })}
            placeholder="הדביקי כאן את קישור הביט"
          />
          <Input
            id="pay-link-paybox"
            label="קישור קבוצת פייבוקס"
            value={links.paybox}
            onChange={(e) => setLinks({ ...links, paybox: e.target.value })}
            placeholder="הדביקי כאן את קישור קבוצת הפייבוקס"
          />
          <Button onClick={handleSaveLinks}>שמירת הקישורים</Button>
        </div>
      )}
    </div>
  );
}

export default PaymentRequestButton;
