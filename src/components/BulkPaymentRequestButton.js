import { useEffect, useState } from "react";
import {
  buildWhatsappReminderUrl,
  buildBulkPaymentRequestMessage,
} from "../services/paymentsService";
import { getPaymentLinks } from "../services/paymentSettingsService";
import Modal from "./Modal";
import Button from "./Button";
import "../styles/payments.css";

/*
  BulkPaymentRequestButton — בקשת תשלום גורפת לתלמידים שנבחרו.
  וואטסאפ לא שולח לכמה נמענים בקישור אחד, לכן נפתחת שיחה נפרדת לכל הורה
  (לוחצים "שליחה" ליד כל שם). בוחרים אמצעי (ביט/פייבוקס/מזומן), ההודעה מוכנה
  עם קישור התשלום של הוועד וניתנת לעריכה. סימון "נשלח" מונע שליחה כפולה.
*/
const METHODS = [
  { value: "bit", label: "BIT" },
  { value: "paybox", label: "פייבוקס" },
  { value: "cash", label: "מזומן" },
];

function BulkPaymentRequestButton({ students }) {
  const [isOpen, setIsOpen] = useState(false);
  const [method, setMethod] = useState("bit");
  const [links, setLinks] = useState({ bit: "", paybox: "" });
  const [message, setMessage] = useState("");
  const [edited, setEdited] = useState(false);
  const [sentIds, setSentIds] = useState(() => new Set());

  useEffect(() => {
    if (isOpen) {
      getPaymentLinks()
        .then(setLinks)
        .catch(() => {});
    }
  }, [isOpen]);

  // ההודעה מתעדכנת לפי האמצעי/הקישורים — אלא אם המשתמשת ערכה אותה ידנית
  useEffect(() => {
    if (!edited) {
      setMessage(buildBulkPaymentRequestMessage(method, links));
    }
  }, [method, links, edited]);

  function open() {
    setSentIds(new Set());
    setMethod("bit");
    setEdited(false);
    setIsOpen(true);
  }

  function chooseMethod(value) {
    setMethod(value);
    setEdited(false); // אמצעי חדש → הודעה חדשה עם הקישור המתאים
  }

  function markSent(id) {
    setSentIds((prev) => new Set(prev).add(id));
  }

  const sentCount = students.filter((s) => sentIds.has(s.id)).length;

  return (
    <>
      <Button
        variant="brand"
        onClick={open}
        disabled={students.length === 0}
      >
        💸 בקשת תשלום לנבחרים
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`בקשת תשלום ל-${students.length} הורים`}
      >
        <div className="bulk-reminder">
          <p className="bulk-reminder__note">באיזה אמצעי לבקש מההורים לשלם?</p>
          <div className="bulk-pay__methods">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`bulk-pay__method${
                  method === m.value ? " bulk-pay__method--active" : ""
                }`}
                onClick={() => chooseMethod(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <label className="field__label" htmlFor="bulk-pay-message">
            ההודעה שתישלח (אפשר לערוך)
          </label>
          <textarea
            id="bulk-pay-message"
            className="bulk-reminder__textarea"
            rows={5}
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              setEdited(true);
            }}
          />

          <p className="bulk-reminder__note">
            וואטסאפ נפתח לכל הורה בנפרד — לוחצים "שליחה" ליד כל שם. נשלחו{" "}
            <strong>{sentCount}</strong> מתוך <strong>{students.length}</strong>.
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
