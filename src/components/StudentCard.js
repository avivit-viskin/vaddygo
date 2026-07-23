import Card from "./Card";
import Button from "./Button";
import PaymentRequestButton from "./PaymentRequestButton";
import { formatShekels, formatBirthday } from "../services/format";
import { paymentMethodLabel } from "../services/paymentMethods";

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
              🎂 יום הולדת: {formatBirthday(student.birthDate)}
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
              🕒 תשלום אחרון: {formatBirthday(summary.lastPaymentDate)}
            </small>
          )}
          <span>
            טלפון הורה:{" "}
            <a href={`tel:${student.parentPhoneNumber}`} dir="ltr">
              {student.parentPhoneNumber}
            </a>
          </span>
          {student.parentBPhone && (
            <span>
              טלפון הורה ב׳:{" "}
              <a href={`tel:${student.parentBPhone}`} dir="ltr">
                {student.parentBPhone}
              </a>
            </span>
          )}
          {student.allergies && (
            <small className="student-card__allergies">
              ⚠️ אלרגיות: {student.allergies}
            </small>
          )}
          </div>
        </div>
        <div className="student-card__actions">
          <Button variant="brand" onClick={() => onPayments(student)}>
            תשלומים 💰
          </Button>
          {!readOnly && <PaymentRequestButton student={student} />}
          {!readOnly && (
            <Button variant="secondary" onClick={() => onEdit(student)}>
              עריכה
            </Button>
          )}
          {!readOnly && (
            <Button variant="danger" onClick={() => onDelete(student)}>
              מחיקה
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default StudentCard;
