import { useEffect, useState } from "react";
import {
  buildWhatsappReminderUrl,
  buildBulkPaymentRequestMessage,
} from "../services/paymentsService";
import { getPaymentLinks } from "../services/paymentSettingsService";
import { getOnboarding } from "../services/onboardingService";
import Modal from "./Modal";
import Button from "./Button";
import CopyMessageButton from "./CopyMessageButton";
import "../styles/payments.css";

/*
  BulkPaymentRequestButton — בקשת תשלום גורפת לתלמידים שנבחרו.
  ההודעה אוטומטית וניתנת לעריכה: שם הוועד, מקום למילוי הסכום, ושני קישורי
  התשלום של הוועד (ביט + פייבוקס) שמוגדרים בהגדרות. וואטסאפ לא שולח לכמה
  נמענים בקישור אחד, לכן נפתחת שיחה נפרדת לכל הורה ("שליחה" ליד כל שם).
*/
function BulkPaymentRequestButton({ students }) {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState({ bit: "", paybox: "" });
  const [message, setMessage] = useState("");
  const [edited, setEdited] = useState(false);
  const [sentIds, setSentIds] = useState(() => new Set());

  const ganName = getOnboarding()?.ganName || "";

  // קישורי התשלום של הוועד נטענים בפתיחת החלון
  useEffect(() => {
    if (isOpen) {
      getPaymentLinks()
        .then(setLinks)
        .catch(() => {});
    }
  }, [isOpen]);

  // ההודעה מתעדכנת אוטומטית (עם הקישורים) — אלא אם המשתמשת ערכה אותה ידנית
  useEffect(() => {
    if (!edited) {
      setMessage(buildBulkPaymentRequestMessage(ganName, links));
    }
  }, [ganName, links, edited]);

  function open() {
    setSentIds(new Set());
    setEdited(false);
    setIsOpen(true);
  }

  function markSent(id) {
    setSentIds((prev) => new Set(prev).add(id));
  }

  const sentCount = students.filter((s) => sentIds.has(s.id)).length;
  const hasLinks = Boolean(links.bit || links.paybox);

  return (
    <>
      <Button variant="brand" onClick={open} disabled={students.length === 0}>
        💸 בקשת תשלום לנבחרים
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`בקשת תשלום ל-${students.length} הורים`}
      >
        <div className="bulk-reminder">
          {!hasLinks && (
            <p className="bulk-reminder__note">
              💡 אפשר להוסיף קישורי תשלום (ביט/פייבוקס) ב<strong>הגדרות</strong>,
              והם ייכנסו אוטומטית להודעה.
            </p>
          )}
          <label className="field__label" htmlFor="bulk-pay-message">
            ההודעה שתישלח (אפשר לערוך)
          </label>
          <textarea
            id="bulk-pay-message"
            className="bulk-reminder__textarea"
            rows={7}
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              setEdited(true);
            }}
          />

          {/* דרך 1 — הודעה אחת לכולם: מעתיקים ומדביקים בקבוצת ההורים */}
          <div className="bulk-reminder__group-send">
            <p className="bulk-reminder__note">
              📣 <strong>לשלוח לכולם בבת אחת:</strong> להעתיק את ההודעה ולהדביק
              אותה בקבוצת הוואטסאפ של ההורים — כך כולם מקבלים אותה בהודעה אחת.
            </p>
            <CopyMessageButton text={message} />
          </div>

          {/* דרך 2 — לכל הורה בנפרד (וואטסאפ חוסם שליחה לכמה מספרים בקישור אחד) */}
          <p className="bulk-reminder__note">
            💬 <strong>או לכל הורה בנפרד:</strong> לוחצים "שליחה" ליד כל שם
            (וואטסאפ נפתח עם ההודעה מוכנה). נשלחו <strong>{sentCount}</strong> מתוך{" "}
            <strong>{students.length}</strong>.
          </p>
          <ul className="bulk-reminder__list">
            {students.map((student) => {
              const isSent = sentIds.has(student.id);
              return (
                <li
                  key={student.id}
                  className={`bulk-reminder__item${
                    isSent ? " bulk-reminder__item--sent" : ""
                  }`}
                >
                  <span>
                    {isSent && "✅ "}
                    {student.firstName} {student.lastName}
                  </span>
                  <a
                    className="bulk-reminder__send"
                    href={buildWhatsappReminderUrl(
                      student.parentPhoneNumber,
                      message
                    )}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => markSent(student.id)}
                  >
                    <Button variant="secondary">
                      {isSent ? "שליחה חוזרת" : "שליחה 💬"}
                    </Button>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </Modal>
    </>
  );
}

export default BulkPaymentRequestButton;
