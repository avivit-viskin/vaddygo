import { useState } from "react";
import Card from "./Card";
import Button from "./Button";
import Icon from "./Icon";
import PaymentRequestButton from "./PaymentRequestButton";
import PhoneActions from "./PhoneActions";
import { formatShekels, formatBirthday } from "../services/format";
import { paymentMethodLabel } from "../services/paymentMethods";

// מסתיר את רוב ספרות הטלפון (משאיר 4 אחרונות) — פרטיות מפני מבט מהצד
function maskPhone(phone) {
  const s = String(phone || "");
  return s.length <= 4 ? s : "•••" + s.slice(-4);
}

// סדר האמצעים בפירוט (כמו קוביות הבית); מציגים רק אמצעי שבו שולם סכום כלשהו.
// טקסט בלבד, בלי אייקונים — לבקשת בעלת המוצר בכרטיס התלמיד.
const METHOD_ORDER = ["bit", "paybox", "cash", "card"];
function paidMethodParts(byMethod) {
  return METHOD_ORDER.filter((m) => (Number(byMethod?.[m]) || 0) > 0).map(
    (m) => `${paymentMethodLabel(m)} ${formatShekels(byMethod[m])}`
  );
}

/*
  StudentCard — כרטיס תלמיד אחד ברשימה: שם מלא, יום הולדת (בקטן), סכום ששולם,
  כיתה/קבוצה, טלפון הורה (לחיץ לחיוג מהנייד), תג סטטוס תשלום,
  ופעולות תשלומים/עריכה/מחיקה. תצוגה בלבד — הלוגיקה אצל ההורה (StudentsPage).
  summary אופציונלי: { paidCount, totalCount, allPaid } — נטען אחרי הכרטיסים.
*/
function StudentCard({
  student,
  summary,
  selected,
  onToggleSelect,
  onPayments,
  onEdit,
  onDelete,
  readOnly = false,
}) {
  const [showPhones, setShowPhones] = useState(false);
  return (
    <Card>
      <div className="student-card">
        <div className="student-card__main">
          {onToggleSelect && !readOnly && (
            <input
              type="checkbox"
              className="student-card__select"
              checked={Boolean(selected)}
              onChange={() => onToggleSelect(student.id)}
              aria-label={`בחירת ${student.firstName} ${student.lastName}`}
            />
          )}
          <div className="student-card__details">
          <strong>
            {student.firstName} {student.lastName}
            {summary && summary.totalCount > 0 && (
              <span
                className={`pay-badge${summary.allPaid ? " pay-badge--paid" : ""}`}
              >
                שולם {summary.paidCount}/{summary.totalCount}
              </span>
            )}
          </strong>
          {student.birthDate && (
            <small className="student-card__birthday">
              <Icon name="cake" size={13} /> יום הולדת:{" "}
              {formatBirthday(student.birthDate)}
            </small>
          )}
          {student.className && <span>קבוצה: {student.className}</span>}
          <span>שולם עד כה: <strong>{formatShekels(student.totalPaid)}</strong></span>
          {summary?.paidByMethod && paidMethodParts(summary.paidByMethod).length > 0 && (
            <small className="student-card__methods">
              {paidMethodParts(summary.paidByMethod).join(" · ")}
            </small>
          )}
          {summary?.lastPaymentDate && (
            <small className="student-card__updated">
              <Icon name="clock" size={13} /> תשלום אחרון:{" "}
              {formatBirthday(summary.lastPaymentDate)}
            </small>
          )}
          <span className="student-card__phone">
            טלפון הורה:{" "}
            {showPhones ? (
              <PhoneActions
                phone={student.parentPhoneNumber}
                label={`ההורה של ${student.firstName}`}
              />
            ) : (
              <span dir="ltr" className="student-card__masked">
                {maskPhone(student.parentPhoneNumber)}
              </span>
            )}
            <button
              type="button"
              className="student-card__reveal"
              aria-label={showPhones ? "הסתרת הטלפון" : "הצגת הטלפון"}
              onClick={() => setShowPhones((v) => !v)}
            >
              👁
            </button>
          </span>
          {student.parentBPhone && (
            <span className="student-card__phone">
              טלפון הורה ב׳:{" "}
              {showPhones ? (
                <PhoneActions
                  phone={student.parentBPhone}
                  label={`הורה ב׳ של ${student.firstName}`}
                />
              ) : (
                <span dir="ltr" className="student-card__masked">
                  {maskPhone(student.parentBPhone)}
                </span>
              )}
            </span>
          )}
          {student.allergies && (
            <small className="student-card__allergies">
              <Icon name="warning" size={13} /> אלרגיות: {student.allergies}
            </small>
          )}
          </div>
        </div>
        <div className="student-card__actions">
          <Button variant="brand" onClick={() => onPayments(student)}>
            <Icon name="card" size={16} /> תשלומים
          </Button>
          {!readOnly && <PaymentRequestButton student={student} />}
          {!readOnly && (
            <Button variant="secondary" onClick={() => onEdit(student)}>
              עריכה
            </Button>
          )}
          {!readOnly && (
            <span className="student-card__delete-wrap">
              <Button variant="danger" onClick={() => onDelete(student)}>
                מחיקה
              </Button>
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

export default StudentCard;
