import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useApi from "../hooks/useApi";
import { getStudent } from "../services/studentsService";
import { getGroups } from "../services/groupsService";
import {
  getStudentPayments,
  saveStudentPayment,
  buildWhatsappReminderUrl,
  buildReminderMessage,
} from "../services/paymentsService";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import PaymentRow from "./payments/PaymentRow";
import "../styles/payments.css";

const EMPTY_ROW = { bit: "", paybox: "", cash: "" };

/*
  StudentPaymentsPage — תשלומי תלמיד לפי קטגוריות (שלב 5, UI_SPEC ס' 11+15):
  לכל קטגוריה שדות סכום לביט/פייבוקס/מזומן; ממלאים את כל הקטגוריות,
  ולוחצים "אישור" אחד בסוף ששומר הכל וחוזר לרשימת התלמידים.
*/
function StudentPaymentsPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const [student, payments, groups] = await Promise.all([
      getStudent(studentId),
      getStudentPayments(studentId),
      getGroups(),
    ]);
    return { student, payments, groups };
  }, [studentId]);

  const { data, isLoading, error, reload } = useApi(load);

  // הסכומים של כל הקטגוריות מנוהלים כאן; כפתור "אישור" אחד שומר את כולם.
  // { [categoryId]: { bit, paybox, cash } }
  const [amounts, setAmounts] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // אתחול הסכומים מהנתונים שנטענו
  useEffect(() => {
    if (!data?.payments) {
      return;
    }
    const init = {};
    data.payments.forEach((p) => {
      init[p.collectionCategoryId] = {
        bit: p.bitAmount || "",
        paybox: p.payBoxAmount || "",
        cash: p.cashAmount || "",
      };
    });
    setAmounts(init);
  }, [data]);

  if (isLoading) {
    return <Spinner text="טוען את התשלומים..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={reload} />;
  }

  const { student, payments } = data;
  const fullName = `${student.firstName} ${student.lastName}`;

  // מספר התשלומים לכל קטגוריה — כפי שהמנהל הגדיר ב"עריכת גבייה"
  const installmentsByCategory = {};
  (data.groups?.[0]?.categories ?? []).forEach((c) => {
    installmentsByCategory[c.id] = c.installments;
  });
  const unpaid = payments.filter((p) => !p.isPaid);
  const reminderUrl = buildWhatsappReminderUrl(
    student.parentPhoneNumber,
    buildReminderMessage(fullName, unpaid)
  );

  // שמירת כל הקטגוריות יחד; קטגוריה עם סכום כלשהו מסומנת "שולם".
  async function confirm() {
    setSaveError("");
    setIsSaving(true);
    try {
      await Promise.all(
        payments.map((p) => {
          const a = amounts[p.collectionCategoryId] ?? EMPTY_ROW;
          const bit = Number(a.bit) || 0;
          const paybox = Number(a.paybox) || 0;
          const cash = Number(a.cash) || 0;
          return saveStudentPayment(studentId, p.collectionCategoryId, {
            bitAmount: bit,
            payBoxAmount: paybox,
            cashAmount: cash,
            isPaid: bit + paybox + cash > 0,
          });
        })
      );
      navigate("/students");
    } catch (err) {
      setSaveError(err.message);
      setIsSaving(false);
    }
  }

  return (
    <div className="payments">
      <Link to="/students" className="payments__back">
        › חזרה לתלמידים
      </Link>

      <div className="payments__header">
        <h2>תשלומים — {fullName}</h2>
        <p className="payments__summary">
          מלאי כמה שולם בכל אמצעי, ולחצי "אישור" בסוף.
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
              payment={payment}
              installments={installmentsByCategory[payment.collectionCategoryId] ?? 1}
              amounts={amounts[payment.collectionCategoryId] ?? EMPTY_ROW}
              onChange={(next) =>
                setAmounts((prev) => ({
                  ...prev,
                  [payment.collectionCategoryId]: next,
                }))
              }
            />
          ))}

          {saveError && (
            <p className="field__error" role="alert">
              {saveError}
            </p>
          )}

          <div className="form-actions">
            <Button onClick={confirm} isLoading={isSaving}>
              אישור
            </Button>
            {unpaid.length > 0 && (
              <a
                className="payments__whatsapp"
                href={reminderUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="secondary">שלחי תזכורת בוואטסאפ 💬</Button>
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default StudentPaymentsPage;
