import Button from "../../components/Button";
import Input from "../../components/Input";
import Select from "../../components/Select";
import ErrorMessage from "../../components/ErrorMessage";
import useForm from "../../hooks/useForm";
import { GIFT_STATUSES } from "../../services/giftStatus";

/*
  GiftForm — הוספה/עריכה של מתנה (UI_SPEC ס' 12): שם, אירוע (חג קרוב),
  תקציב, סטטוס וספק. אותו טופס לשני המצבים — gift=null בהוספה.
  רשימת החגים והספקים מגיעה מההורה כדי לא לחשב אותה מחדש בכל רינדור.
*/
function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "צריך למלא שם למתנה";
  if (values.totalAmount === "" || Number(values.totalAmount) < 0) {
    errors.totalAmount = "צריך למלא סכום (0 ומעלה)";
  }
  return errors;
}

function GiftForm({ gift, holidays, vendors, onSave, onCancel }) {
  const { values, errors, submitError, isSubmitting, handleChange, handleSubmit } =
    useForm(
      {
        name: gift?.name || "",
        holidayKey: gift?.holidayKey || "",
        totalAmount: gift?.totalAmount != null ? String(gift.totalAmount) : "",
        status: gift?.status || "planned",
        vendorId: gift?.vendorId != null ? String(gift.vendorId) : "",
      },
      validate
    );

  function handleSave(formValues) {
    const holiday = holidays.find((h) => h.key === formValues.holidayKey);
    return onSave({
      name: formValues.name.trim(),
      holidayKey: formValues.holidayKey || null,
      holidayName: holiday ? holiday.name : null,
      totalAmount: Number(formValues.totalAmount),
      status: formValues.status,
      vendorId: formValues.vendorId ? Number(formValues.vendorId) : null,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleSave)} noValidate>
      <Input
        id="gift-name"
        name="name"
        label="שם המתנה"
        value={values.name}
        error={errors.name}
        onChange={handleChange}
        placeholder="למשל: מתנת ראש השנה"
      />
      <Select
        id="gift-holiday"
        name="holidayKey"
        label="אירוע (אופציונלי)"
        value={values.holidayKey}
        onChange={handleChange}
      >
        <option value="">ללא אירוע מסוים</option>
        {holidays.map((holiday) => (
          <option key={holiday.key} value={holiday.key}>
            {holiday.name}
          </option>
        ))}
      </Select>
      <Input
        id="gift-total"
        name="totalAmount"
        label="תקציב (₪)"
        type="number"
        min="0"
        value={values.totalAmount}
        error={errors.totalAmount}
        onChange={handleChange}
        placeholder="למשל: 800"
      />
      <Select
        id="gift-status"
        name="status"
        label="סטטוס"
        value={values.status}
        onChange={handleChange}
      >
        {GIFT_STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </Select>
      <Select
        id="gift-vendor"
        name="vendorId"
        label="ספק (אופציונלי)"
        value={values.vendorId}
        onChange={handleChange}
      >
        <option value="">ללא ספק</option>
        {vendors.map((vendor) => (
          <option key={vendor.id} value={vendor.id}>
            {vendor.name}
          </option>
        ))}
      </Select>
      {submitError && <ErrorMessage message={submitError} />}
      <div className="gift-form__actions">
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

export default GiftForm;
