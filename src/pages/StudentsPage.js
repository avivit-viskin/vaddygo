import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../hooks/useApi";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../services/studentsService";
import { getPaymentSummary } from "../services/paymentsService";
import { getGroups } from "../services/groupsService";
import { getOnboarding } from "../services/onboardingService";
import { getActiveServerGroupId } from "../services/institutionsService";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import Checkbox from "../components/Checkbox";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import StudentCard from "../components/StudentCard";
import StudentForm from "../components/StudentForm";
import ConfirmDialog from "../components/ConfirmDialog";
import StudentsImport from "./students/StudentsImport";
import BulkReminderButton from "../components/BulkReminderButton";
import BulkPaymentRequestButton from "../components/BulkPaymentRequestButton";
import "../styles/students.css";

/*
  StudentsPage — מסך התלמידים המלא (שלב 2, לפי UI_SPEC ס' 11):
  מונה "X תלמידים", כרטיסים, חיפוש חופשי, סינון לפי כיתה,
  הוספה ועריכה באותו טופס במודאל, ומחיקה עם דיאלוג אישור.
*/
function StudentsPage() {
  const navigate = useNavigate();
  const { data: students, isLoading, error, reload } = useApi(getStudents);
  const { data: groups } = useApi(getGroups);

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);

  // סיכום תשלומים לכל תלמיד (לתג ולסינון) — נטען אחרי שהתלמידים הגיעו,
  // לא חוסם את הצגת הכרטיסים. { [studentId]: { paidCount, totalCount, allPaid, hasUnpaid } }
  const [summaries, setSummaries] = useState({});

  // הטופס משמש גם להוספה (editedStudent ריק) וגם לעריכה
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedStudent, setEditedStudent] = useState(null);

  // מחיקה עם אישור
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ייבוא תלמידים מקובץ
  const [isImportOpen, setIsImportOpen] = useState(false);

  // טעינת סיכומי התשלום במקביל לכל התלמידים (ברקע, אחרי הרשימה)
  useEffect(() => {
    if (!students || students.length === 0) {
      setSummaries({});
      return;
    }
    let cancelled = false;
    Promise.all(
      students.map((student) => getPaymentSummary(student.id).catch(() => null))
    ).then((results) => {
      if (cancelled) return;
      const next = {};
      results.forEach((summary) => {
        if (summary) next[summary.studentId] = summary;
      });
      setSummaries(next);
    });
    return () => {
      cancelled = true;
    };
  }, [students]);

  // הקבוצות מוגדרות בהגדרה הראשונית של הגן. שדה/פילטר הקבוצה מוצגים רק
  // כשהמוסד מחולק לקבוצות; אחרת אין "כיתה/קבוצה" בכלל.
  // חשוב לריבוי מוסדות: לוקחים את קבוצות המוסד ה*פעיל* (לפי serverGroupId),
  // לא תמיד את הראשון ברשימה — אחרת מוסד שני יראה את קבוצות המוסד הראשון.
  const subgroups = useMemo(() => {
    if (!groups || groups.length === 0) return [];
    const activeId = getActiveServerGroupId();
    const activeGroup =
      groups.find((g) => g.id === activeId) ?? groups[0];
    return activeGroup?.subgroups ?? [];
  }, [groups]);
  const hasGroups = subgroups.length > 0;

  const visibleStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (students ?? []).filter((student) => {
      if (classFilter && student.className !== classFilter) {
        return false;
      }
      // "טרם שילמו": מסתיר רק תלמידים שידוע שסיימו לשלם; מי שהסיכום שלו
      // עדיין לא נטען נשאר גלוי כדי לא להעלים תלמידים בטעות.
      if (onlyUnpaid) {
        const summary = summaries[student.id];
        if (summary && !summary.hasUnpaid) {
          return false;
        }
      }
      if (!term) {
        return true;
      }
      const haystack =
        `${student.firstName} ${student.lastName} ${student.className} ${student.parentPhoneNumber}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [students, searchTerm, classFilter, onlyUnpaid, summaries]);

  function openAddForm() {
    setEditedStudent(null);
    setIsFormOpen(true);
  }

  function openEditForm(student) {
    setEditedStudent(student);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditedStudent(null);
  }

  /* שמירה משותפת להוספה ולעריכה; שגיאה נזרקת הלאה ומוצגת בתוך הטופס.
     תאריך לידה ריק נשלח כ-null (ולא כמחרוזת ריקה) כדי שהשרת יקבל אותו. */
  async function saveStudent(values) {
    const payload = { ...values, birthDate: values.birthDate || null };
    if (editedStudent) {
      await updateStudent(editedStudent.id, payload);
    } else {
      await createStudent(payload);
    }
    closeForm();
    await reload();
  }

  function closeDeleteDialog() {
    setStudentToDelete(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteStudent(studentToDelete.id);
      setStudentToDelete(null);
      await reload();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <Spinner text="טוען את רשימת התלמידים..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={reload} />;
  }

  const totalCount = students?.length ?? 0;
  // מספר הילדים שהוגדר בהקמת הגן — "כמה מתוך כמה" נמצאים כבר ברשימה
  const configuredCount = Number(getOnboarding()?.childrenCount) || 0;

  return (
    <div>
      <div className="page-header">
        <h2>
          {configuredCount > 0
            ? `${totalCount} מתוך ${configuredCount} תלמידים`
            : `${totalCount} תלמידים`}
        </h2>
        <div className="page-header__actions">
          <Button variant="brand" onClick={openAddForm}>
            + הוספת תלמיד
          </Button>
          <Button variant="secondary" onClick={() => setIsImportOpen(true)}>
            📄 ייבוא מקובץ
          </Button>
          <BulkPaymentRequestButton students={students ?? []} />
          <BulkReminderButton
            totalStudents={totalCount}
            unpaidStudents={(students ?? []).filter(
              (s) => summaries[s.id]?.hasUnpaid
            )}
          />
        </div>
      </div>

      {totalCount === 0 ? (
        <EmptyState message="עדיין אין תלמידים — הוסיפי את הראשונה!" />
      ) : (
        <>
          <div className="toolbar">
            <Input
              id="students-search"
              label="חיפוש"
              type="search"
              placeholder="שם, כיתה או טלפון..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            {hasGroups && (
              <Select
                id="students-class-filter"
                label="סינון לפי קבוצה"
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
              >
                <option value="">כל הקבוצות</option>
                {subgroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </Select>
            )}
            <Checkbox
              id="students-only-unpaid"
              label="הצג רק מי שטרם שילם"
              checked={onlyUnpaid}
              onChange={(event) => setOnlyUnpaid(event.target.checked)}
            />
          </div>

          {visibleStudents.length === 0 ? (
            <EmptyState icon="🔍" message="לא נמצאו תלמידים שמתאימים לחיפוש" />
          ) : (
            visibleStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                summary={summaries[student.id]}
                onPayments={(s) => navigate(`/students/${s.id}/payments`)}
                onEdit={openEditForm}
                onDelete={setStudentToDelete}
              />
            ))
          )}
        </>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editedStudent ? "עריכת פרטי תלמיד" : "הוספת תלמיד חדש"}
      >
        {/* key מאלץ טופס נקי בכל פתיחה — להוספה או לתלמיד אחר */}
        <StudentForm
          key={editedStudent?.id ?? "new"}
          initialStudent={editedStudent}
          subgroups={subgroups}
          onSubmit={saveStudent}
          onCancel={closeForm}
        />
      </Modal>

      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="ייבוא תלמידים מקובץ"
      >
        <StudentsImport
          onDone={reload}
          onCancel={() => setIsImportOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={studentToDelete !== null}
        title="מחיקת תלמיד"
        message={
          studentToDelete
            ? `למחוק את ${studentToDelete.firstName} ${studentToDelete.lastName}? אי אפשר לבטל`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
}

export default StudentsPage;
