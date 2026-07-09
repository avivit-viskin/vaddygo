import { useState } from "react";
import { buildWhatsappReminderUrl } from "../services/paymentsService";
import Modal from "./Modal";
import Button from "./Button";
import "../styles/payments.css";

/*
  BulkReminderButton — תזכורת גורפת לכל ההורים שטרם שילמו.
  וואטסאפ לא שולח לכמה נמענים בקישור אחד, לכן נפתחת שיחה נפרדת לכל הורה:
  המשתמשת לוחצת "שליחה" ליד כל שם. ההודעה גנרית וניתנת לעריכה לפני השליחה.
*/
const DEFAULT_MESSAGE = [
  "שלום לך :)",
  "אנחנו עושים עכשיו מעבר על התשלומים לגן של השנה ואנחנו רואים שלא סיימת להסדיר את התשלום.",
  "נא לטפל בזה בהקדם האפשרי",
  "תודה !",
].join("\n");

function BulkReminderButton({ unpaidStudents }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        📣 תזכורת לחייבים
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="תזכורת לכל מי שטרם שילם"
      >
        {unpaidStudents.length === 0 ? (
          <p className="bulk-reminder__done">כל ההורים שילמו! 🎉</p>
        ) : (
          <div className="bulk-reminder">
            <label className="field__label" htmlFor="bulk-message">
              ההודעה שתישלח (אפשר לערוך)
            </label>
            <textarea
              id="bulk-message"
              className="bulk-reminder__textarea"
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <p className="bulk-reminder__note">
              וואטסאפ נפתח לכל הורה בנפרד — לוחצים "שליחה" ליד כל שם.{" "}
              <strong>{unpaidStudents.length}</strong> הורים ברשימה.
            </p>
            <ul className="bulk-reminder__list">
              {unpaidStudents.map((student) => (
                <li key={student.id} className="bulk-reminder__item">
                  <span>
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
                  >
                    <Button variant="secondary">שליחה 💬</Button>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}

export default BulkReminderButton;
