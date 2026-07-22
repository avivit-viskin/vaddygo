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
