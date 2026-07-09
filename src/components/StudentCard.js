import Card from "./Card";
import Button from "./Button";

/*
  StudentCard — כרטיס תלמיד אחד ברשימה: שם מלא, כיתה/קבוצה, טלפון הורה
  (לחיץ לחיוג מהנייד), תג סטטוס תשלום, ופעולות תשלומים/עריכה/מחיקה.
  תצוגה בלבד — הלוגיקה אצל ההורה (StudentsPage).
  summary אופציונלי: { paidCount, totalCount, allPaid } — נטען אחרי הכרטיסים.
*/
function StudentCard({ student, summary, onPayments, onEdit, onDelete }) {
  return (
    <Card>
      <div className="student-card">
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
          <span>כיתה/קבוצה: {student.className}</span>
          <span>
            טלפון הורה:{" "}
            <a href={`tel:${student.parentPhoneNumber}`} dir="ltr">
              {student.parentPhoneNumber}
            </a>
          </span>
        </div>
        <div className="student-card__actions">
          <Button onClick={() => onPayments(student)}>תשלומים 💰</Button>
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
