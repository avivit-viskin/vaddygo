import Button from "../../components/Button";
import Input from "../../components/Input";
import ErrorMessage from "../../components/ErrorMessage";
import useForm from "../../hooks/useForm";

/*
  FolderForm — הוספה/עריכה של קישור תיקיית Drive (UI_SPEC ס' 13): שם + קישור.
  אותו טופס לשני המצבים — folder=null בהוספה.
*/
function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "צריך למלא שם לתיקייה";
  if (!values.url.trim()) {
    errors.url = "צריך להדביק את קישור התיקייה";
  } else if (!/^https?:\/\//i.test(values.url.trim())) {
    errors.url = "הקישור צריך להתחיל ב-http או https";
  }
  return errors;
}

function FolderForm({ folder, onSave, onCancel }) {
  const { values, errors, submitError, isSubmitting, handleChange, handleSubmit } =
    useForm(
      { name: folder?.name || "", url: folder?.url || "" },
      validate
    );

  const onSubmit = handleSubmit((formValues) =>
    onSave({ name: formValues.name.trim(), url: formValues.url.trim() })
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Input
        id="folder-name"
        name="name"
        label="שם התיקייה"
        value={values.name}
        error={errors.name}
        onChange={handleChange}
        placeholder="למשל: יום המשפחה"
      />
      <Input
        id="folder-url"
        name="url"
        label="קישור התיקייה מ-Google Drive"
        type="url"
        value={values.url}
        error={errors.url}
        onChange={handleChange}
        placeholder="כאן מדביקים את קישור השיתוף"
      />
      <p
        style={{
          margin: "-6px 0 10px",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
        }}
      >
        💡 חשוב שהקישור יעבוד לכולם: ב-Google Drive לוחצים על הקובץ/התיקייה →{" "}
        <strong>שיתוף</strong> → משנים ל<strong>"כל מי שיש לו הקישור"</strong>{" "}
        (הרשאת צפייה) → <strong>העתקת קישור</strong>, ומדביקים כאן. אחרת מי
        שלוחץ יראה "אין גישה".
      </p>
      {submitError && <ErrorMessage message={submitError} />}
      <div className="folder-form__actions">
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

export default FolderForm;
