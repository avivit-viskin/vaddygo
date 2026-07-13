import { useState } from "react";
import Input from "../../components/Input";
import Checkbox from "../../components/Checkbox";
import Button from "../../components/Button";

/*
  EventForm — טופס הוספת/עריכת אירוע ללוח השנה (מוצג בתוך Modal).
  במצב עריכה מקבל initialEvent וממלא את השדות מראש.
  ולידציה בלקוח: שם ותאריך חובה. הכפתור נעול בזמן שמירה.
*/
function EventForm({ onSave, defaultDate, initialEvent }) {
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
  const [whatToBring, setWhatToBring] = useState(initialEvent?.whatToBring || "");
  const [parentPhone, setParentPhone] = useState(initialEvent?.parentPhone || "");
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

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
        label="👪 אירוע שמשתף הורה (למשל אמא/אבא של שבת)"
        checked={shareWithParent}
        onChange={(e) => setShareWithParent(e.target.checked)}
      />
      {shareWithParent && (
        <>
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
