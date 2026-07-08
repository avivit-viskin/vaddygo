import Button from "../../components/Button";
import Input from "../../components/Input";
import ErrorMessage from "../../components/ErrorMessage";
import useForm from "../../hooks/useForm";

/*
  StaffForm — טופס הוספה/עריכה של איש צוות (UI_SPEC ס' 8):
  שם מלא, תפקיד, תאריך לידה. אותו טופס לשני המצבים — member=null בהוספה.
*/
function validate(values) {
  const errors = {};
  if (!values.fullName.trim()) errors.fullName = "צריך למלא שם מלא";
  if (!values.role.trim()) errors.role = "צריך למלא תפקיד";
  if (!values.birthDate) {
    errors.birthDate = "צריך לבחור תאריך לידה";
  } else if (new Date(values.birthDate) > new Date()) {
    errors.birthDate = "תאריך הלידה חייב להיות בעבר";
  }
  return errors;
}

function StaffForm({ member, onSave, onCancel }) {
  const { values, errors, submitError, isSubmitting, handleChange, handleSubmit } =
    useForm(
      {
        fullName: member?.fullName || "",
        role: member?.role || "",
        birthDate: member?.birthDate ? member.birthDate.slice(0, 10) : "",
      },
      validate
    );

  return (
    <form onSubmit={handleSubmit(onSave)} noValidate>
      <Input
        id="staff-fullName"
        name="fullName"
        label="שם מלא"
        value={values.fullName}
        error={errors.fullName}
        onChange={handleChange}
        placeholder="למשל: רותי לוי"
      />
      <Input
        id="staff-role"
        name="role"
        label="תפקיד"
        value={values.role}
        error={errors.role}
        onChange={handleChange}
        placeholder="למשל: גננת"
      />
      <Input
        id="staff-birthDate"
        name="birthDate"
        label="תאריך לידה"
        type="date"
        value={values.birthDate}
        error={errors.birthDate}
        onChange={handleChange}
      />
      {submitError && <ErrorMessage message={submitError} />}
      <div className="staff-form__actions">
        <Button type="submit" isLoading={isSubmitting}>
          שמירה
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  );
}

export default StaffForm;
