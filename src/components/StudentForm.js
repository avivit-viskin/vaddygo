import useForm from "../hooks/useForm";
import Input from "./Input";
import Select from "./Select";
import Button from "./Button";

/* פורמט טלפון נייד ישראלי: 05X-XXXXXXX (המקף אופציונלי) — זהה לוולידציה בשרת. */
const ISRAELI_MOBILE_PATTERN = /^05\d-?\d{7}$/;

/* hasGroups=true → שדה הקבוצה חובה (רק כשהמוסד מחולק לקבוצות). */
export function validateStudent(values, hasGroups = false) {
  const errors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "שם פרטי הוא שדה חובה";
  }
  if (!values.lastName.trim()) {
    errors.lastName = "שם משפחה הוא שדה חובה";
  }
  if (hasGroups && !values.className.trim()) {
    errors.className = "יש לבחור קבוצה";
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
  ועריכה (initialStudent עם נתונים). שדה הקבוצה מוצג רק אם המוסד מחולק
  לקבוצות (subgroups מההגדרה הראשונית). כפתור השמירה נעול בזמן שליחה,
  ושגיאת שרת מוצגת בתוך הטופס בלי לסגור אותו.
*/
function StudentForm({ initialStudent = null, subgroups = [], onSubmit, onCancel }) {
  const hasGroups = subgroups.length > 0;

  const { values, errors, submitError, isSubmitting, handleChange, handleSubmit } =
    useForm(
      {
        firstName: initialStudent?.firstName ?? "",
        lastName: initialStudent?.lastName ?? "",
        parentName: initialStudent?.parentName ?? "",
        birthDate: initialStudent?.birthDate ?? "",
        className: initialStudent?.className ?? "",
        parentPhoneNumber: initialStudent?.parentPhoneNumber ?? "",
        // שדות נוספים (מיובאים מקובץ משרד החינוך; כולם לא חובה)
        idNumber: initialStudent?.idNumber ?? "",
        gender: initialStudent?.gender ?? "",
        allergies: initialStudent?.allergies ?? "",
        address: initialStudent?.address ?? "",
        parentEmail: initialStudent?.parentEmail ?? "",
        parentBName: initialStudent?.parentBName ?? "",
        parentBPhone: initialStudent?.parentBPhone ?? "",
        parentBEmail: initialStudent?.parentBEmail ?? "",
        parentsMarried: initialStudent?.parentsMarried ?? "",
      },
      (v) => validateStudent(v, hasGroups)
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
        id="student-parent-name"
        name="parentName"
        label="שם הורה (לא חובה)"
        value={values.parentName}
        onChange={handleChange}
        error={errors.parentName}
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
      {hasGroups && (
        <Select
          id="student-class-name"
          name="className"
          label="קבוצה"
          value={values.className}
          onChange={handleChange}
          error={errors.className}
        >
          <option value="">בחרי קבוצה...</option>
          {subgroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </Select>
      )}
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

      {/* פרטים נוספים — מגיעים אוטומטית מקובץ משרד החינוך, וניתן להשלים ידנית.
          תעודת הזהות נשמרת (לזיהוי כפילויות בייבוא) אך אינה מוצגת — מטעמי פרטיות. */}
      <details className="student-form__extra">
        <summary>פרטים נוספים (לא חובה)</summary>

        <Input
          id="student-gender"
          name="gender"
          label="מין"
          value={values.gender}
          onChange={handleChange}
        />
        <Input
          id="student-allergies"
          name="allergies"
          label="אלרגיות"
          placeholder="למשל: בוטנים, ביצים"
          value={values.allergies}
          onChange={handleChange}
        />
        <Input
          id="student-address"
          name="address"
          label="כתובת"
          value={values.address}
          onChange={handleChange}
        />
        <Input
          id="student-parent-email"
          name="parentEmail"
          label='דוא"ל הורה א׳'
          type="email"
          dir="ltr"
          value={values.parentEmail}
          onChange={handleChange}
        />
        <Input
          id="student-parent-b-name"
          name="parentBName"
          label="שם הורה ב׳"
          value={values.parentBName}
          onChange={handleChange}
        />
        <Input
          id="student-parent-b-phone"
          name="parentBPhone"
          label="טלפון הורה ב׳"
          type="tel"
          dir="ltr"
          placeholder="050-1234567"
          value={values.parentBPhone}
          onChange={handleChange}
        />
        <Input
          id="student-parent-b-email"
          name="parentBEmail"
          label='דוא"ל הורה ב׳'
          type="email"
          dir="ltr"
          value={values.parentBEmail}
          onChange={handleChange}
        />
        <Input
          id="student-parents-married"
          name="parentsMarried"
          label="האם ההורים נשואים"
          placeholder="כן / לא"
          value={values.parentsMarried}
          onChange={handleChange}
        />
      </details>

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
