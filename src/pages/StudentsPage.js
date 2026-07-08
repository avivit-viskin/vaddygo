import { useMemo, useState } from "react";
import useApi from "../hooks/useApi";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../services/studentsService";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import StudentCard from "../components/StudentCard";
import StudentForm from "../components/StudentForm";
import ConfirmDialog from "../components/ConfirmDialog";

/*
  StudentsPage — מסך התלמידים המלא (שלב 2, לפי UI_SPEC ס' 11):
  מונה "X תלמידים", כרטיסים, חיפוש חופשי, סינון לפי כיתה,
  הוספה ועריכה באותו טופס במודאל, ומחיקה עם דיאלוג אישור.
*/
function StudentsPage() {
  const { data: students, isLoading, error, reload } = useApi(getStudents);

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");

  // הטופס משמש גם להוספה (editedStudent ריק) וגם לעריכה
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedStudent, setEditedStudent] = useState(null);

  // מחיקה עם אישור
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const classNames = useMemo(
    () =>
      [...new Set((students ?? []).map((student) => student.className))].sort(
        (a, b) => a.localeCompare(b, "he")
      ),
    [students]
  );

  const visibleStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (students ?? []).filter((student) => {
      if (classFilter && student.className !== classFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack =
        `${student.firstName} ${student.lastName} ${student.className} ${student.parentPhoneNumber}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [students, searchTerm, classFilter]);

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

  /* שמירה משותפת להוספה ולעריכה; שגיאה נזרקת הלאה ומוצגת בתוך הטופס. */
  async function saveStudent(values) {
    if (editedStudent) {
      await updateStudent(editedStudent.id, values);
    } else {
      await createStudent(values);
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

  return (
    <div>
      <div className="page-header">
        <h2>{totalCount} תלמידים</h2>
        <Button onClick={openAddForm}>+ הוספת תלמיד</Button>
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
            <Select
              id="students-class-filter"
              label="סינון לפי כיתה"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
            >
              <option value="">כל הכיתות</option>
              {classNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>

          {visibleStudents.length === 0 ? (
            <EmptyState icon="🔍" message="לא נמצאו תלמידים שמתאימים לחיפוש" />
          ) : (
            visibleStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
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
          onSubmit={saveStudent}
          onCancel={closeForm}
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
