import Card from "./Card";
import Button from "./Button";
import PaymentRequestButton from "./PaymentRequestButton";
import { formatShekels, formatBirthday } from "../services/format";

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
}) {
  return (
    <Card>
      <div className="student-card">
        <div className="student-card__main">
          {onToggleSelect && (
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
          </div>
        </div>
        <div className="student-card__actions">
          <Button variant="brand" onClick={() => onPayments(student)}>
            תשלומים 💰
          </Button>
          <PaymentRequestButton student={student} />
          <Button variant="secondary" onClick={() => onEdit(student)}>
            עריכה
          </Button>
          <Button variant="danger" onClick={() => onDelete(student)}>
            מחיקה
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default StudentCard;
