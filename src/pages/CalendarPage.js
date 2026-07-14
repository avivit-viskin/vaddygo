import { useMemo, useState } from "react";
import useApi from "../hooks/useApi";
import {
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  parseEventDate,
} from "../services/eventsService";
import {
  getHolidayBudgets,
  setHolidayBudget,
  holidayBudgetKey,
} from "../services/holidayBudgetsService";
import {
  getHolidaysForMonth,
  getHolidayOccurrencesForMonth,
  getRoshChodeshForMonth,
  holidayEmoji,
} from "../data/holidays";
import { hebrewDateLabel } from "../services/hebrewDate";
import { whatsappUrl } from "../services/whatsapp";
import MonthGrid from "./calendar/MonthGrid";
import EventForm from "./calendar/EventForm";
import HolidaysSection from "./calendar/HolidaysSection";
import HolidayBudgetDialog from "./calendar/HolidayBudgetDialog";
import Modal from "../components/Modal";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import "../styles/calendar.css";

/*
  CalendarPage — מסך לוח השנה, בנוי משלושה מדורים (לפי בקשת בעלת המוצר):
  1. הלוח עצמו + אפשרות הוספת אירוע בצד.
  2. חגים: שם ותאריך של כל חג בחודש + הגדרת תקציב לחג בחלון ייעודי.
  3. האירועים שלי — רשימת אירועי הגן של החודש, עם מחיקה באישור.
*/
const monthTitleFormatter = new Intl.DateTimeFormat("he", {
  month: "long",
  year: "numeric",
});
const hebrewMonthFormatter = new Intl.DateTimeFormat("he-u-ca-hebrew", {
  month: "long",
});
const listDateFormatter = new Intl.DateTimeFormat("he", {
  day: "numeric",
  month: "numeric",
});

function toDateInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* וואטסאפ להורה עם מה להביא לאירוע (אמא/אבא של שבת) */
function parentWhatsappUrl(event) {
  const message =
    `שלום 🙂 לקראת "${event.name}", נשמח אם תביאו: ${event.whatToBring}. תודה רבה! 💜`;
  return `${whatsappUrl(event.parentPhone)}?text=${encodeURIComponent(message)}`;
}

function CalendarPage({ initialDate }) {
  const [viewDate, setViewDate] = useState(() => {
    const base = initialDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1, 12);
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [addDate, setAddDate] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [budgetTarget, setBudgetTarget] = useState(null);
  // לחיצה על יום בלוח פותחת חלון עם אירועי אותו יום (צפייה, עריכה, והוספה)
  const [dayView, setDayView] = useState(null);

  const { data: events, isLoading, error, reload } = useApi(getEvents);
  const { data: budgets, reload: reloadBudgets } = useApi(getHolidayBudgets);

  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();

  const holidayOccurrences = useMemo(
    () => getHolidayOccurrencesForMonth(year, monthIndex),
    [year, monthIndex]
  );

  const holidaysByDay = useMemo(
    () => getHolidaysForMonth(year, monthIndex),
    [year, monthIndex]
  );

  const roshChodeshDays = useMemo(
    () => getRoshChodeshForMonth(year, monthIndex),
    [year, monthIndex]
  );

  const monthEvents = useMemo(() => {
    return (events || [])
      .map((event) => ({ ...event, date: parseEventDate(event.eventDate) }))
      .filter(
        (event) =>
          event.date.getFullYear() === year &&
          event.date.getMonth() === monthIndex
      )
      .sort((a, b) => a.date - b.date);
  }, [events, year, monthIndex]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const event of monthEvents) {
      const day = event.date.getDate();
      map.set(day, [...(map.get(day) || []), event]);
    }
    return map;
  }, [monthEvents]);

  const lastOfMonth = new Date(year, monthIndex + 1, 0, 12);
  const hebrewFirst = hebrewMonthFormatter.format(viewDate);
  const hebrewLast = hebrewMonthFormatter.format(lastOfMonth);
  // טווח החודשים העבריים בלי מספר השנה (5784) — לפי בקשת בעלת המוצר
  const hebrewRange =
    hebrewFirst === hebrewLast ? hebrewFirst : `${hebrewFirst}–${hebrewLast}`;

  function moveMonth(step) {
    setViewDate(new Date(year, monthIndex + step, 1, 12));
  }

  function openAddForm(dateValue) {
    setAddDate(dateValue);
    setIsFormOpen(true);
  }

  /* פותח את חלון היום: מציג את האירועים של אותו יום (וחגים אם יש) */
  function openDayView(day) {
    const date = new Date(year, monthIndex, day, 12);
    setDayView({
      dateValue: toDateInputValue(date),
      dateLabel: listDateFormatter.format(date),
      hebrewLabel: hebrewDateLabel(date),
      events: eventsByDay.get(day) || [],
      holidays: holidaysByDay.get(day) || [],
    });
  }

  /* עריכה/מחיקה/הוספה מתוך חלון היום — סוגר אותו ופותח את הפעולה */
  function editFromDayView(event) {
    setDayView(null);
    setEditTarget(event);
  }

  function deleteFromDayView(event) {
    setDayView(null);
    setDeleteTarget(event);
  }

  function addFromDayView() {
    const dateValue = dayView?.dateValue;
    setDayView(null);
    openAddForm(dateValue);
  }

  async function handleSave(newEvent) {
    await addEvent(newEvent);
    setIsFormOpen(false);
    await reload();
  }

  async function handleUpdate(fields) {
    await updateEvent(editTarget.id, fields);
    setEditTarget(null);
    await reload();
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteEvent(deleteTarget.id);
      setDeleteTarget(null);
      await reload();
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSaveBudget(amount) {
    await setHolidayBudget(
      holidayBudgetKey(budgetTarget.name, budgetTarget.hebrewYear),
      amount
    );
    setBudgetTarget(null);
    await reloadBudgets();
  }

  if (isLoading) {
    return <Spinner text="טוען את לוח השנה..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={reload} />;
  }

  const today = new Date();
  const defaultFormDate =
    today.getFullYear() === year && today.getMonth() === monthIndex
      ? toDateInputValue(today)
      : toDateInputValue(viewDate);

  return (
    <div>
      {/* מדור 1: הלוח + הוספת אירוע בצד */}
      <div className="calendar-layout">
        <div className="calendar-layout__grid">
          <div className="calendar-header">
            <button
              type="button"
              className="calendar-nav-button"
              aria-label="החודש הקודם"
              onClick={() => moveMonth(-1)}
            >
              →
            </button>
            <div className="calendar-header__titles">
              <h2 className="calendar-header__month">
                {monthTitleFormatter.format(viewDate)}
              </h2>
              <p className="calendar-header__hebrew">{hebrewRange}</p>
            </div>
            <button
              type="button"
              className="calendar-nav-button"
              aria-label="החודש הבא"
              onClick={() => moveMonth(1)}
            >
              ←
            </button>
          </div>

          <MonthGrid
            year={year}
            monthIndex={monthIndex}
            holidaysByDay={holidaysByDay}
            eventsByDay={eventsByDay}
            roshChodeshDays={roshChodeshDays}
            onDayClick={openDayView}
          />
        </div>

        <aside className="calendar-side">
          <Button variant="brand" onClick={() => openAddForm(defaultFormDate)}>
            + הוספת אירוע
          </Button>
          <p>לחצי על יום בלוח כדי לראות את האירועים שלו ולהוסיף/לערוך, או על הכפתור להוספה מהירה 🙂</p>
        </aside>
      </div>

      {/* מדור 2: חגים החודש + תקציב לכל חג */}
      <HolidaysSection
        year={year}
        monthIndex={monthIndex}
        occurrences={holidayOccurrences}
        budgets={budgets || {}}
        onEditBudget={setBudgetTarget}
      />

      {/* מדור 3: האירועים שלי */}
      <section className="calendar-list" aria-label="האירועים שלי החודש">
        <h3>האירועים שלי</h3>
        {monthEvents.length === 0 && (
          <p>אין אירועים החודש — אפשר להוסיף את הראשון!</p>
        )}
        {monthEvents.map((event) => (
          <div className="calendar-list__item" key={event.id}>
            <span className="calendar-list__date">
              {listDateFormatter.format(event.date)}
              <span className="calendar-list__hebrew">
                {hebrewDateLabel(event.date)}
              </span>
            </span>
            <span className="calendar-list__name">
              {event.name}
              {event.reminder && " 🔔"}
              {event.shareWithParent && " 👪"}
            </span>
            {event.shareWithParent && event.parentPhone && (
              <a
                className="calendar-list__whatsapp"
                href={parentWhatsappUrl(event)}
                target="_blank"
                rel="noreferrer"
                aria-label={`שליחת וואטסאפ להורה על ${event.name}`}
              >
                💬
              </a>
            )}
            <button
              type="button"
              className="calendar-list__edit"
              aria-label={`עריכת האירוע ${event.name}`}
              onClick={() => setEditTarget(event)}
            >
              ✏️
            </button>
            <button
              type="button"
              className="calendar-list__delete"
              aria-label={`מחיקת האירוע ${event.name}`}
              onClick={() => setDeleteTarget(event)}
            >
              🗑️
            </button>
          </div>
        ))}
      </section>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="אירוע חדש"
      >
        <EventForm onSave={handleSave} defaultDate={addDate || defaultFormDate} />
      </Modal>

      <Modal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="עריכת אירוע"
      >
        {editTarget && (
          <EventForm onSave={handleUpdate} initialEvent={editTarget} />
        )}
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="מחיקת אירוע"
      >
        <p>
          למחוק את "{deleteTarget?.name}"? אי אפשר לבטל את הפעולה.
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
            מחיקה
          </Button>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            ביטול
          </Button>
        </div>
      </Modal>

      {/* חלון היום: אירועי היום שנבחר, עם עריכה/מחיקה והוספה */}
      <Modal
        isOpen={Boolean(dayView)}
        onClose={() => setDayView(null)}
        title={dayView ? `${dayView.dateLabel} · ${dayView.hebrewLabel}` : ""}
      >
        {dayView && (
          <div className="calendar-day-view">
            {dayView.holidays.length === 0 && dayView.events.length === 0 ? (
              <p className="calendar-day-view__empty">
                אין אירועים ביום זה 🙂
              </p>
            ) : (
              <ul className="calendar-day-view__list">
                {/* חגים נחשבים אירועים גם הם — מוצגים אוטומטית, בלי עריכה/מחיקה */}
                {dayView.holidays.map((name) => (
                  <li
                    key={`holiday-${name}`}
                    className="calendar-day-view__item calendar-day-view__item--holiday"
                  >
                    <span className="calendar-day-view__name">
                      {holidayEmoji(name) ? `${holidayEmoji(name)} ` : ""}
                      {name}
                    </span>
                    <span className="calendar-day-view__tag">חג</span>
                  </li>
                ))}

                {/* האירועים שהוזנו — עם עריכה ומחיקה */}
                {dayView.events.map((event) => (
                  <li key={event.id} className="calendar-day-view__item">
                    <span className="calendar-day-view__name">
                      {event.name}
                      {event.reminder && " 🔔"}
                      {event.shareWithParent && " 👪"}
                    </span>
                    <span className="calendar-day-view__actions">
                      <button
                        type="button"
                        className="calendar-list__edit"
                        aria-label={`עריכת ${event.name}`}
                        onClick={() => editFromDayView(event)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="calendar-list__delete"
                        aria-label={`מחיקת ${event.name}`}
                        onClick={() => deleteFromDayView(event)}
                      >
                        🗑️
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <Button variant="brand" onClick={addFromDayView}>
              + הוספת אירוע ליום זה
            </Button>
          </div>
        )}
      </Modal>

      {budgetTarget && (
        <HolidayBudgetDialog
          key={`${budgetTarget.name}-${budgetTarget.hebrewYear}`}
          holiday={budgetTarget}
          currentAmount={
            (budgets || {})[
              holidayBudgetKey(budgetTarget.name, budgetTarget.hebrewYear)
            ] ?? null
          }
          onSave={handleSaveBudget}
          onClose={() => setBudgetTarget(null)}
        />
      )}
    </div>
  );
}

export default CalendarPage;
