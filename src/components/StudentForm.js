import useForm from "../hooks/useForm";
import Input from "./Input";
import Button from "./Button";

/* פורמט טלפון נייד ישראלי: 05X-XXXXXXX (המקף אופציונלי) — זהה לוולידציה בשרת. */
const ISRAELI_MOBILE_PATTERN = /^05\d-?\d{7}$/;

/* בחירת קבוצה אינה חובה — תלמיד בלי קבוצה שייך אוטומטית לקבוצה הכללית. */
export function validateStudent(values) {
  const errors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "שם פרטי הוא שדה חובה";
  }
  if (!values.lastName.trim()) {
    errors.lastName = "שם משפחה הוא שדה חובה";
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
        gender: initialStudent?.gender ?? "",
        address: initialStudent?.address ?? "",
        parentEmail: initialStudent?.parentEmail ?? "",
        parentBName: initialStudent?.parentBName ?? "",
        parentBPhone: initialStudent?.parentBPhone ?? "",
        parentBEmail: initialStudent?.parentBEmail ?? "",
        parentsMarried: initialStudent?.parentsMarried ?? "",
      },
      (v) => validateStudent(v)
    );

  // הסרת התלמיד מהקבוצה → חוזר לקבוצה הכללית (שדה הקבוצה מתרוקן)
  const clearGroup = () =>
    handleChange({ target: { name: "className", value: "" } });

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
        <>
          {/* בחירה מהרשימה או כתיבה חופשית של קבוצה חדשה (למשל "צהרון").
              לא חובה — ריק = הקבוצה הכללית. */}
          <Input
            id="student-class-name"
            name="className"
            label="קבוצה (לא חובה)"
            value={values.className}
            onChange={handleChange}
            error={errors.className}
            list="student-groups-list"
            autoComplete="off"
            placeholder="ריק = הקבוצה הכללית"
          />
          <datalist id="student-groups-list">
            {subgroups.map((group) => (
              <option key={group} value={group} />
            ))}
          </datalist>
          {values.className.trim() && (
            <button
              type="button"
              onClick={clearGroup}
              style={{
                marginTop: -6,
                marginBottom: 12,
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--color-primary-dark)",
                font: "inherit",
                fontSize: "var(--font-size-sm)",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              הסרה מהקבוצה (העברה לקבוצה הכללית)
            </button>
          )}
        </>
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
