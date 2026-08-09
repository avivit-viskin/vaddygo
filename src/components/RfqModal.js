import { useEffect, useState } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { createLead } from "../services/leadsService";
import { getActiveInstitution } from "../services/institutionsService";
import { getUser } from "../services/authService";

/*
  RfqModal — טופס "בקשת הצעת מחיר" שהוועד שולח לספק. הבקשה נוחתת בתיבת הפניות
  של הספק (פיצ'ר Pro): מה רוצים, כמות, תאריך, תקציב והודעה — ופרטי קשר כדי
  שהספק יחזור. נפתח מכרטיס הספק במסך המתנות.
*/
function RfqModal({ vendor, isOpen, onClose, onSent }) {
  const [subject, setSubject] = useState("");
  const [quantity, setQuantity] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // איפוס בכל פתיחה; שם איש הקשר מוקדם מפרטי המשתמשת המחוברת
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const user = getUser();
    setSubject("");
    setQuantity("");
    setEventDate("");
    setBudget("");
    setMessage("");
    setContactName(user?.username || "");
    setContactPhone("");
    setError("");
    setSending(false);
    setSent(false);
  }, [isOpen]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!subject.trim() && !message.trim()) {
      setError("כתבו מה תרצו להזמין, או הודעה קצרה לספק");
      return;
    }
    if (!contactPhone.trim()) {
      setError("צריך טלפון כדי שהספק יוכל לחזור אליכם");
      return;
    }
    setSending(true);
    setError("");
    try {
      await createLead(vendor.id, {
        subject: subject.trim(),
        quantity: quantity ? Number(quantity) : null,
        eventDate: eventDate || null,
        budget: budget ? Number(budget) : null,
        message: message.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        committeeName: getActiveInstitution()?.name || "",
      });
      setSent(true);
      if (onSent) {
        onSent();
      }
    } catch (err) {
      setError(err.message || "לא הצלחנו לשלוח. אפשר לנסות שוב.");
      setSending(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`בקשת הצעת מחיר${vendor?.name ? ` — ${vendor.name}` : ""}`}
    >
      {sent ? (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 700, color: "var(--color-success)", margin: "6px 0" }}>
            הבקשה נשלחה לספק ✓
          </p>
          <p style={{ color: "var(--color-text-muted)", margin: "0 0 14px" }}>
            הספק יראה את הבקשה בתיבת הפניות שלו ויחזור אליכם בהקדם.
          </p>
          <Button onClick={onClose}>סגירה</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <p style={{ margin: "0 0 10px", color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
            ממלאים כמה פרטים, והספק יחזור אליכם עם הצעת מחיר.
          </p>
          <Input
            id="rfq-subject"
            label="מה תרצו להזמין?"
            placeholder="למשל: מארזי סוף שנה לצוות"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Input
            id="rfq-qty"
            label="כמות (לא חובה)"
            type="number"
            inputMode="numeric"
            placeholder="למשל: 25"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Input
            id="rfq-date"
            label="תאריך האירוע (לא חובה)"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <Input
            id="rfq-budget"
            label="תקציב משוער (₪, לא חובה)"
            type="number"
            inputMode="numeric"
            placeholder="למשל: 1500"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
          <label className="field__label" htmlFor="rfq-msg">
            הודעה לספק (לא חובה)
          </label>
          <textarea
            id="rfq-msg"
            className="field__input"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="פרטים נוספים, העדפות, שאלות…"
            style={{ resize: "vertical", marginBottom: 10 }}
          />
          <Input
            id="rfq-name"
            label="שם איש קשר"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
          <Input
            id="rfq-phone"
            label="טלפון לחזרה"
            type="tel"
            inputMode="tel"
            placeholder="050-0000000"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
          {error && (
            <p className="field__error" role="alert">
              {error}
            </p>
          )}
          <div style={{ marginTop: 10 }}>
            <Button type="submit" isLoading={sending}>
              שליחת הבקשה לספק
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default RfqModal;
