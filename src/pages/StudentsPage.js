import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../hooks/useApi";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../services/studentsService";
import { getAllPaymentSummaries } from "../services/paymentsService";
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

  // בחירת תלמידים למחיקה גורפת (סט של מזהים)
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState("");

  // אישור הוספה כשהשם כבר קיים ברשימה (payload ממתין לאישור)
  const [duplicatePending, setDuplicatePending] = useState(null);
  const [isAddingDuplicate, setIsAddingDuplicate] = useState(false);
  const [duplicateError, setDuplicateError] = useState("");

  // ייבוא תלמידים מקובץ
  const [isImportOpen, setIsImportOpen] = useState(false);

  // סיכומי התשלום לכל התלמידים — בבקשה *אחת* מרוכזת (במקום בקשה לכל תלמיד),
  // ברקע אחרי הרשימה כדי לא לחסום את הצגת הכרטיסים.
  useEffect(() => {
    if (!students || students.length === 0) {
      setSummaries({});
      return;
    }
    let cancelled = false;
    getAllPaymentSummaries()
      .then((list) => {
        if (cancelled) return;
        const next = {};
        list.forEach((summary) => {
          next[summary.studentId] = summary;
        });
        setSummaries(next);
      })
      .catch(() => {
        if (!cancelled) setSummaries({});
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

  /* השוואת שם מלא (שם פרטי + משפחה), ללא תלות ברווחים/אותיות גדולות. */
  function sameFullName(a, b) {
    return (
      `${a.firstName} ${a.lastName}`.trim().toLowerCase() ===
      `${b.firstName} ${b.lastName}`.trim().toLowerCase()
    );
  }

  /* שמירה משותפת להוספה ולעריכה; שגיאה נזרקת הלאה ומוצגת בתוך הטופס.
     תאריך לידה ריק נשלח כ-null (ולא כמחרוזת ריקה) כדי שהשרת יקבל אותו.
     בהוספה — אם השם כבר קיים ברשימה, מבקשים אישור לפני שמוסיפים שוב. */
  async function saveStudent(values) {
    const payload = { ...values, birthDate: values.birthDate || null };
    if (editedStudent) {
      await updateStudent(editedStudent.id, payload);
      closeForm();
      await reload();
      return;
    }
    const isDuplicate = (students ?? []).some((s) => sameFullName(s, values));
    if (isDuplicate) {
      closeForm();
      setDuplicatePending(payload); // מחכים לאישור/ביטול בדיאלוג
      return;
    }
    await createStudent(payload);
    closeForm();
    await reload();
  }

  /* אישור הוספת תלמיד ששמו כבר קיים — מוסיפים אותו בכל זאת. */
  async function confirmAddDuplicate() {
    setIsAddingDuplicate(true);
    setDuplicateError("");
    try {
      await createStudent(duplicatePending);
      setDuplicatePending(null);
      await reload();
    } catch (err) {
      setDuplicateError(err.message);
    } finally {
      setIsAddingDuplicate(false);
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  /* מחיקה גורפת של כל התלמידים שנבחרו (במקביל), עם אישור. */
  async function confirmBulkDelete() {
    setIsBulkDeleting(true);
    setBulkDeleteError("");
    try {
      await Promise.all([...selectedIds].map((id) => deleteStudent(id)));
      setSelectedIds(new Set());
      setShowBulkDelete(false);
      await reload();
    } catch (err) {
      setBulkDeleteError(err.message);
    } finally {
      setIsBulkDeleting(false);
    }
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

  const allVisibleSelected =
    visibleStudents.length > 0 &&
    visibleStudents.every((s) => selectedIds.has(s.id));

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleStudents.forEach((s) => next.delete(s.id));
      } else {
        visibleStudents.forEach((s) => next.add(s.id));
      }
      return next;
    });
  }

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
          <BulkPaymentRequestButton students={visibleStudents} />
        </div>
      </div>

      {totalCount === 0 ? (
        <EmptyState message="עדיין אין תלמידים — אפשר להוסיף את הראשון!" />
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
            <Checkbox
              id="students-select-all"
              label="סמן הכל"
              checked={allVisibleSelected}
              onChange={toggleSelectAll}
            />
          </div>

          {selectedIds.size > 0 && (
            <div className="students-selection">
              <span className="students-selection__count">
                {selectedIds.size} נבחרו
              </span>
              <Button variant="danger" onClick={() => setShowBulkDelete(true)}>
                🗑️ מחיקת הנבחרים
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedIds(new Set())}
              >
                ביטול בחירה
              </Button>
            </div>
          )}

          {visibleStudents.length === 0 ? (
            <EmptyState icon="🔍" message="לא נמצאו תלמידים שמתאימים לחיפוש" />
          ) : (
            visibleStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                summary={summaries[student.id]}
                selected={selectedIds.has(student.id)}
                onToggleSelect={toggleSelect}
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

      {/* אישור הוספת תלמיד ששמו כבר קיים ברשימה */}
      <ConfirmDialog
        isOpen={duplicatePending !== null}
        title="השם כבר קיים ברשימה"
        message={
          duplicatePending
            ? `השם "${duplicatePending.firstName} ${duplicatePending.lastName}" כבר נמצא ברשימת התלמידים. להוסיף אותו שוב?`
            : ""
        }
        confirmLabel="אישור"
        cancelLabel="ביטול"
        confirmVariant="brand"
        onConfirm={confirmAddDuplicate}
        onCancel={() => {
          setDuplicatePending(null);
          setDuplicateError("");
        }}
        isLoading={isAddingDuplicate}
        error={duplicateError}
      />

      {/* אישור מחיקה גורפת של התלמידים שנבחרו */}
      <ConfirmDialog
        isOpen={showBulkDelete}
        title="מחיקת תלמידים"
        message={`למחוק ${selectedIds.size} תלמידים שנבחרו? אי אפשר לבטל`}
        confirmLabel="כן, למחוק"
        cancelLabel="ביטול"
        onConfirm={confirmBulkDelete}
        onCancel={() => {
          setShowBulkDelete(false);
          setBulkDeleteError("");
        }}
        isLoading={isBulkDeleting}
        error={bulkDeleteError}
      />
    </div>
  );
}

export default StudentsPage;
