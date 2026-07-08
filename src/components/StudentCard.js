import Card from "./Card";
import Button from "./Button";

/*
  StudentCard — כרטיס תלמיד אחד ברשימה: שם מלא, כיתה/קבוצה, טלפון הורה
  (לחיץ לחיוג מהנייד), ופעולות עריכה ומחיקה.
  תצוגה בלבד — הלוגיקה אצל ההורה (StudentsPage).
*/
function StudentCard({ student, onEdit, onDelete }) {
  return (
    <Card>
      <div className="student-card">
        <div className="student-card__details">
          <strong>
            {student.firstName} {student.lastName}
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
