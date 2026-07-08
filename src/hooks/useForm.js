import { useState } from "react";

/*
  useForm — hook גנרי לטפסים, לשימוש בכל טופס במערכת:
  ערכים, שגיאת ולידציה ליד כל שדה, שגיאת שליחה מהשרת,
  ונעילת כפתור השליחה בזמן שליחה (isSubmitting).

  validate מקבל את הערכים ומחזיר אובייקט { שםשדה: הודעה } — ריק כשהכל תקין.
  הודעת השגיאה של שדה נמחקת ברגע שמקלידים בו שוב.
*/
export default function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  }

  function handleSubmit(onValid) {
    return async (event) => {
      event.preventDefault();
      setSubmitError("");

      const validationErrors = validate ? validate(values) : {};
      setErrors(validationErrors);
      if (Object.values(validationErrors).some(Boolean)) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onValid(values);
      } catch (err) {
        setSubmitError(err.message);
      } finally {
        setIsSubmitting(false);
      }
    };
  }

  return { values, errors, submitError, isSubmitting, handleChange, handleSubmit };
}
