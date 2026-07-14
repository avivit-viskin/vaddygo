import Button from "../../components/Button";
import Input from "../../components/Input";
import Select from "../../components/Select";
import ErrorMessage from "../../components/ErrorMessage";
import useForm from "../../hooks/useForm";
import { GIFT_STATUSES } from "../../services/giftStatus";
import { PAYMENT_METHODS } from "../../services/paymentMethods";

/*
  GiftForm — הוספה/עריכה של מתנה (UI_SPEC ס' 12): שם, אירוע (חג קרוב),
  תקציב, סטטוס וספק. אותו טופס לשני המצבים — gift=null בהוספה.
  רשימת החגים והספקים מגיעה מההורה כדי לא לחשב אותה מחדש בכל רינדור.
  "אחר" מאפשר להקליד אירוע חופשי — הוא נשמר עם מפתח custom| ומופיע ברשימת
  "הוצאות חגים" כמו כל אירוע אחר.
*/
const OTHER_KEY = "__other__";
const CUSTOM_PREFIX = "custom|";

// מפתח לאירוע חופשי — מבוסס על השם שהוקלד, כדי שמתנות לאותו אירוע יתקבצו יחד
function customHolidayKey(name) {
  return `${CUSTOM_PREFIX}${name}`;
}

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "צריך למלא שם למתנה";
  if (values.totalAmount === "" || Number(values.totalAmount) < 0) {
    errors.totalAmount = "צריך למלא סכום (0 ומעלה)";
  }
  if (values.holidayKey === OTHER_KEY && !values.customHoliday.trim()) {
    errors.customHoliday = "צריך למלא שם לאירוע";
  }
  return errors;
}

function GiftForm({ gift, holidays, vendors, defaultMethod, onSave, onCancel }) {
  // מתנה שנשמרה עם אירוע חופשי — פותחים אותה במצב "אחר" עם השם המוקלד
  const isCustom = Boolean(gift?.holidayKey?.startsWith(CUSTOM_PREFIX));
  const { values, errors, submitError, isSubmitting, handleChange, handleSubmit } =
    useForm(
      {
        name: gift?.name || "",
        holidayKey: isCustom ? OTHER_KEY : gift?.holidayKey || "",
        customHoliday: isCustom ? gift.holidayName || "" : "",
        totalAmount: gift?.totalAmount != null ? String(gift.totalAmount) : "",
        status: gift?.status || "planned",
        method: gift?.method || defaultMethod || "cash",
        vendorId: gift?.vendorId != null ? String(gift.vendorId) : "",
      },
      validate
    );

  function handleSave(formValues) {
    const base = {
      name: formValues.name.trim(),
      totalAmount: Number(formValues.totalAmount),
      status: formValues.status,
      method: formValues.method,
      vendorId: formValues.vendorId ? Number(formValues.vendorId) : null,
    };
    if (formValues.holidayKey === OTHER_KEY) {
      const custom = formValues.customHoliday.trim();
      return onSave({
        ...base,
        holidayKey: custom ? customHolidayKey(custom) : null,
        holidayName: custom || null,
      });
    }
    const holiday = holidays.find((h) => h.key === formValues.holidayKey);
    return onSave({
      ...base,
      holidayKey: formValues.holidayKey || null,
      holidayName: holiday ? holiday.name : null,
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
        <option value={OTHER_KEY}>אחר (הקלדה חופשית)</option>
      </Select>
      {values.holidayKey === OTHER_KEY && (
        <Input
          id="gift-custom-holiday"
          name="customHoliday"
          label="שם האירוע"
          value={values.customHoliday}
          error={errors.customHoliday}
          onChange={handleChange}
          placeholder="למשל: יום המשפחה"
        />
      )}
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
        id="gift-method"
        name="method"
        label="שולם באמצעות"
        value={values.method}
        onChange={handleChange}
      >
        {PAYMENT_METHODS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </Select>
      {values.status === "done" && (
        <p className="gift-form__note">
          המתנה סומנה "בוצע" — הסכום יירד מיתרת הקופה ומאמצעי התשלום שנבחר.
        </p>
      )}
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
