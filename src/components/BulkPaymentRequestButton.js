import { useEffect, useState } from "react";
import {
  buildWhatsappReminderUrl,
  buildWhatsappShareUrl,
  buildBulkPaymentRequestMessage,
} from "../services/paymentsService";
import { getPaymentLinks } from "../services/paymentSettingsService";
import { getOnboarding } from "../services/onboardingService";
import Modal from "./Modal";
import Button from "./Button";
import CopyMessageButton from "./CopyMessageButton";
import WhatsAppIcon from "./WhatsAppIcon";
import "../styles/payments.css";

/*
  BulkPaymentRequestButton — בקשת תשלום בוואטסאפ: לוחצים על הכפתור, ובתוך החלון
  מסמנים את התלמידים שרוצים לשלוח להם (אפשר "סמן הכל"), ושולחים. לכל הורה שמסומן
  נפתחת שיחת וואטסאפ עם ההודעה מוכנה — לוחצים "שליחה" ליד השם. אפשר גם לשלוח
  לכולם ביחד דרך קבוצת ההורים. ההודעה אוטומטית (עם קישורי התשלום מההגדרות) וניתנת
  לעריכה.
*/
function BulkPaymentRequestButton({ students = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState({ bit: "", paybox: "" });
  const [message, setMessage] = useState("");
  const [edited, setEdited] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
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
    setSelectedIds(new Set());
    setSentIds(new Set());
    setEdited(false);
    setIsOpen(true);
  }

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const allSelected =
    students.length > 0 && students.every((s) => selectedIds.has(s.id));

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(students.map((s) => s.id)));
  }

  function markSent(id) {
    setSentIds((prev) => new Set(prev).add(id));
  }

  const selectedStudents = students.filter((s) => selectedIds.has(s.id));
  const sentCount = selectedStudents.filter((s) => sentIds.has(s.id)).length;
  const hasLinks = Boolean(links.bit || links.paybox);

  // מספרי הטלפון של ההורים שנבחרו — להעתקה מהירה ליצירת רשימת תפוצה בוואטסאפ
  const selectedPhones = selectedStudents
    .map((s) => s.parentPhoneNumber)
    .filter(Boolean)
    .join("\n");

  return (
    <>
      <Button
        variant="secondary"
        onClick={open}
        disabled={students.length === 0}
      >
        <WhatsAppIcon size={18} /> בקשת תשלום בוואטסאפ
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="בקשת תשלום בוואטסאפ"
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

          <div className="wa-picker__head">
            <span className="field__label">בחרי למי לשלוח:</span>
            {students.length > 0 && (
              <label className="wa-picker__all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                />
                בחר הכל
              </label>
            )}
          </div>

          <ul className="bulk-reminder__list">
            {students.map((student) => {
              const checked = selectedIds.has(student.id);
              const isSent = sentIds.has(student.id);
              return (
                <li
                  key={student.id}
                  className={`bulk-reminder__item${
                    isSent ? " bulk-reminder__item--sent" : ""
                  }`}
                >
                  <label className="wa-picker__item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(student.id)}
                    />
                    <span>
                      {isSent && "✅ "}
                      {student.firstName} {student.lastName}
                    </span>
                  </label>
                  {checked && (
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
                  )}
                </li>
              );
            })}
          </ul>

          {selectedStudents.length > 0 && (
            <>
              {/* רשימת תפוצה — שליחה אחת לכל ההורים שנבחרו */}
              <div className="bulk-reminder__group-send">
                <p className="bulk-reminder__note">
                  ✅ <strong>ההמלצה שלנו לשליחה לכולם:</strong> להעתיק את מספרי
                  הטלפון וליצור <strong>רשימת תפוצה</strong> בוואטסאפ — כך ההודעה
                  נשלחת לכולם בבת אחת, וכל הורה מקבל אותה בפרטי.
                </p>
                <ol className="bulk-reminder__steps">
                  <li>מעתיקים את המספרים ואת ההודעה (הכפתורים למטה).</li>
                  <li>בוואטסאפ: תפריט (⋮) ➜ "רשימת תפוצה חדשה".</li>
                  <li>מוסיפים את ההורים, מדביקים את ההודעה, ושולחים — כולם מקבלים ביחד 🎉</li>
                </ol>
                <div className="bulk-reminder__group-actions">
                  <CopyMessageButton
                    text={selectedPhones}
                    label="📋 העתקת המספרים"
                  />
                  <CopyMessageButton text={message} label="📋 העתקת ההודעה" />
                  <a
                    href={buildWhatsappShareUrl(message)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="secondary">📲 פתיחת וואטסאפ</Button>
                  </a>
                </div>
                <p className="bulk-reminder__hint">
                  💡 יש לכם קבוצת וואטסאפ של ההורים? אפשר פשוט להעתיק את ההודעה
                  ולהדביק בקבוצה.
                </p>
              </div>

              {/* לחלופין — שליחה אישית לכל הורה */}
              <p className="bulk-reminder__note">
                💬 <strong>או שליחה אישית:</strong> וואטסאפ נפתח לכל הורה מסומן —
                לוחצים "שליחה" ליד השם. נשלחו <strong>{sentCount}</strong> מתוך{" "}
                <strong>{selectedStudents.length}</strong>.
              </p>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

export default BulkPaymentRequestButton;
