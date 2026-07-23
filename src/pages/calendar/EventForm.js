import { useState } from "react";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Checkbox from "../../components/Checkbox";
import Button from "../../components/Button";
import { roleFromGender } from "../../services/shabbatParents";

/*
  EventForm — טופס הוספת/עריכת אירוע ללוח השנה (מוצג בתוך Modal).
  במצב עריכה מקבל initialEvent וממלא את השדות מראש.
  ל"אבא/אמא של שבת": בוחרים ילד/ה מהרשימה — הטלפון של ההורה ממולא לבד, והתפקיד
  (אבא/אמא) נקבע לפי מין הילד/ה (וניתן לשינוי ידני). ולידציה: שם ותאריך חובה.
*/
function EventForm({ onSave, defaultDate, initialEvent, students = [] }) {
  const isEdit = Boolean(initialEvent);
  const [name, setName] = useState(initialEvent?.name || "");
  const [eventDate, setEventDate] = useState(
    initialEvent?.eventDate
      ? initialEvent.eventDate.slice(0, 10)
      : defaultDate || ""
  );
  const [location, setLocation] = useState(initialEvent?.location || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [reminder, setReminder] = useState(Boolean(initialEvent?.reminder));
  const [shareWithParent, setShareWithParent] = useState(
    Boolean(initialEvent?.shareWithParent)
  );
  const [studentId, setStudentId] = useState(
    initialEvent?.studentId ? String(initialEvent.studentId) : ""
  );
  const [shabbatRole, setShabbatRole] = useState(
    initialEvent?.shabbatRole === "mom" ? "mom" : "dad"
  );
  const [whatToBring, setWhatToBring] = useState(initialEvent?.whatToBring || "");
  const [parentPhone, setParentPhone] = useState(initialEvent?.parentPhone || "");
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // בחירת ילד/ה — ממלאת אוטומטית את טלפון ההורה ואת התפקיד (אבא/אמא) לפי המין
  function handleStudentChange(event) {
    const id = event.target.value;
    setStudentId(id);
    const student = students.find((s) => String(s.id) === String(id));
    if (student) {
      if (student.parentPhoneNumber) setParentPhone(student.parentPhoneNumber);
      const derived = roleFromGender(student.gender);
      if (derived) setShabbatRole(derived);
      if (!name.trim()) {
        setName(`${student.firstName} ${student.lastName} — אבא/אמא של שבת`.trim());
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "מה שם האירוע?";
    if (!eventDate) nextErrors.eventDate = "צריך לבחור תאריך";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        eventDate,
        location: location.trim(),
        description: description.trim(),
        reminder,
        shareWithParent,
        whatToBring: shareWithParent ? whatToBring.trim() : "",
        parentPhone: shareWithParent ? parentPhone.trim() : "",
        studentId: shareWithParent ? studentId : "",
        shabbatRole: shareWithParent ? shabbatRole : "",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Input
        id="event-name"
        label="שם האירוע *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="למשל: מסיבת חנוכה"
      />
      <Input
        id="event-date"
        label="תאריך *"
        type="date"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
        error={errors.eventDate}
      />
      <Input
        id="event-location"
        label="מיקום"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="למשל: חצר הגן"
      />
      <Input
        id="event-description"
        label="תיאור"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Checkbox
        id="event-reminder"
        label="🔔 תזכורת לאירוע"
        checked={reminder}
        onChange={(e) => setReminder(e.target.checked)}
      />
      <Checkbox
        id="event-share-parent"
        label="👪 אבא/אמא של שבת (שליחת הודעה להורה)"
        checked={shareWithParent}
        onChange={(e) => setShareWithParent(e.target.checked)}
      />
      {shareWithParent && (
        <>
          <Select
            id="event-student"
            label="הילד/ה שנבחר/ה"
            value={studentId}
            onChange={handleStudentChange}
          >
            <option value="">— בחירת ילד/ה מהרשימה —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </Select>
          <div className="category-row__installments">
            <span>אבא או אמא של שבת?</span>
            <div className="chips">
              <button
                type="button"
                className={`chip${shabbatRole === "dad" ? " chip--active" : ""}`}
                aria-pressed={shabbatRole === "dad"}
                onClick={() => setShabbatRole("dad")}
              >
                אבא של שבת
              </button>
              <button
                type="button"
                className={`chip${shabbatRole === "mom" ? " chip--active" : ""}`}
                aria-pressed={shabbatRole === "mom"}
                onClick={() => setShabbatRole("mom")}
              >
                אמא של שבת
              </button>
            </div>
          </div>
          <Input
            id="event-what-to-bring"
            label="מה להביא?"
            value={whatToBring}
            onChange={(e) => setWhatToBring(e.target.value)}
            placeholder="למשל: חלה, מיץ ענבים ונרות"
          />
          <Input
            id="event-parent-phone"
            label="טלפון ההורה"
            type="tel"
            dir="ltr"
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            placeholder="050-1234567"
          />
        </>
      )}
      <Button type="submit" isLoading={isSaving}>
        {isEdit ? "עדכון האירוע" : "שמירת האירוע"}
      </Button>
    </form>
  );
}

export default EventForm;
