import { useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { getStudent } from "../services/studentsService";
import {
  getStudentPayments,
  buildWhatsappReminderUrl,
  buildReminderMessage,
} from "../services/paymentsService";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import PaymentRow from "./payments/PaymentRow";
import "../styles/payments.css";

/*
  StudentPaymentsPage — תשלומי תלמיד לפי קטגוריות (שלב 5, UI_SPEC ס' 11+15):
  שורה לכל קטגוריית גבייה עם סימון "שולם" ידני וסטטוס צבעוני,
  וכפתור "שלחי תזכורת בוואטסאפ" עם הודעה מוכנה לקטגוריות שטרם שולמו.
*/
function StudentPaymentsPage() {
  const { studentId } = useParams();

  const load = useCallback(async () => {
    const [student, payments] = await Promise.all([
      getStudent(studentId),
      getStudentPayments(studentId),
    ]);
    return { student, payments };
  }, [studentId]);

  const { data, isLoading, error, reload } = useApi(load);

  if (isLoading) {
    return <Spinner text="טוען את התשלומים..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={reload} />;
  }

  const { student, payments } = data;
  const fullName = `${student.firstName} ${student.lastName}`;
  const unpaid = payments.filter((p) => !p.isPaid);
  const paidCount = payments.length - unpaid.length;

  const reminderUrl = buildWhatsappReminderUrl(
    student.parentPhoneNumber,
    buildReminderMessage(fullName, unpaid)
  );

  return (
    <div className="payments">
      <Link to="/students" className="payments__back">
        › חזרה לתלמידים
      </Link>

      <div className="payments__header">
        <h2>תשלומים — {fullName}</h2>
        <p className="payments__summary">
          שולמו {paidCount} מתוך {payments.length} קטגוריות
        </p>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon="💰"
          message="עוד לא הוגדרו קטגוריות גבייה — יש להשלים את הגדרת הגן"
        />
      ) : (
        <>
          {payments.map((payment) => (
            <PaymentRow
              key={payment.collectionCategoryId}
              studentId={studentId}
              payment={payment}
              onSaved={reload}
            />
          ))}

          {unpaid.length > 0 && (
            <a
              className="payments__whatsapp"
              href={reminderUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Button>שלחי תזכורת בוואטסאפ 💬</Button>
            </a>
          )}
        </>
      )}
    </div>
  );
}

export default StudentPaymentsPage;
