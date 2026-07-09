import useForm from "../hooks/useForm";
import Input from "./Input";
import Button from "./Button";

/* פורמט טלפון נייד ישראלי: 05X-XXXXXXX (המקף אופציונלי) — זהה לוולידציה בשרת. */
const ISRAELI_MOBILE_PATTERN = /^05\d-?\d{7}$/;

export function validateStudent(values) {
  const errors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "שם פרטי הוא שדה חובה";
  }
  if (!values.lastName.trim()) {
    errors.lastName = "שם משפחה הוא שדה חובה";
  }
  if (!values.className.trim()) {
    errors.className = "כיתה/קבוצה היא שדה חובה";
  }

  const phone = values.parentPhoneNumber.trim();
  if (!phone) {
    errors.parentPhoneNumber = "טלפון הורה הוא שדה חובה";
  } else if (!ISRAELI_MOBILE_PATTERN.test(phone)) {
    errors.parentPhoneNumber = "מספר הטלפון אינו תקין — הפורמט: 05X-XXXXXXX";
  }

  return errors;
}

/*
  StudentForm — טופס תלמיד אחד לשני מצבים: הוספה (initialStudent ריק)
  ועריכה (initialStudent עם נתונים). כפתור השמירה נעול בזמן שליחה,
  ושגיאת שרת מוצגת בתוך הטופס בלי לסגור אותו.
*/
function StudentForm({ initialStudent = null, onSubmit, onCancel }) {
  const { values, errors, submitError, isSubmitting, handleChange, handleSubmit } =
    useForm(
      {
        firstName: initialStudent?.firstName ?? "",
        lastName: initialStudent?.lastName ?? "",
        birthDate: initialStudent?.birthDate ?? "",
        className: initialStudent?.className ?? "",
        parentPhoneNumber: initialStudent?.parentPhoneNumber ?? "",
      },
      validateStudent
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        id="student-first-name"
        name="firstName"
        label="שם פרטי"
        value={values.firstName}
        onChange={handleChange}
        error={errors.firstName}
      />
      <Input
        id="student-last-name"
        name="lastName"
        label="שם משפחה"
        value={values.lastName}
        onChange={handleChange}
        error={errors.lastName}
      />
      <Input
        id="student-birth-date"
        name="birthDate"
        label="תאריך לידה (לא חובה)"
        type="date"
        value={values.birthDate}
        onChange={handleChange}
        error={errors.birthDate}
      />
      <Input
        id="student-class-name"
        name="className"
        label="כיתה/קבוצה"
        value={values.className}
        onChange={handleChange}
        error={errors.className}
      />
      <Input
        id="student-parent-phone"
        name="parentPhoneNumber"
        label="טלפון הורה"
        type="tel"
        dir="ltr"
        placeholder="050-1234567"
        value={values.parentPhoneNumber}
        onChange={handleChange}
        error={errors.parentPhoneNumber}
      />

      {submitError && (
        <p className="field__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="form-actions">
        <Button type="submit" isLoading={isSubmitting}>
          שמירה
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          ביטול
        </Button>
      </div>
    </form>
  );
}

export default StudentForm;
