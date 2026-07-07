import useApi from "../hooks/useApi";
import { getStudents } from "../services/studentsService";
import Card from "../components/Card";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

/*
  StudentsPage — רשימת התלמידים בגן, עם שלושת המצבים המחייבים:
  טעינה / שגיאה / ריק. טופס הוספה ועריכה ייבנו בשלב 2.
*/
function StudentsPage() {
  const { data: students, isLoading, error, reload } = useApi(getStudents);

  if (isLoading) {
    return <Spinner text="טוען את רשימת התלמידים..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={reload} />;
  }

  if (!students || students.length === 0) {
    return <EmptyState message="עדיין אין תלמידים — הוסיפי את הראשונה!" />;
  }

  return (
    <div>
      <h2>רשימת התלמידים בגן</h2>
      {students.map((student) => (
        <Card key={student.id}>
          <strong>
            {student.firstName} {student.lastName}
          </strong>{" "}
          — כיתה {student.className}, טלפון הורה: {student.parentPhoneNumber}
        </Card>
      ))}
    </div>
  );
}

export default StudentsPage;
