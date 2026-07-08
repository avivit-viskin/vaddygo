import { useMemo, useState } from "react";
import useApi from "../hooks/useApi";
import {
  getEvents,
  addEvent,
  deleteEvent,
  parseEventDate,
} from "../services/eventsService";
import { getHolidaysForMonth } from "../data/holidays";
import MonthGrid from "./calendar/MonthGrid";
import EventForm from "./calendar/EventForm";
import Modal from "../components/Modal";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import "../styles/calendar.css";

/*
  CalendarPage — לוח שנה חודשי בעברית: חגי ישראל + אירועי הגן,
  עם הוספת אירוע (כולל תזכורת) ומחיקה באישור.
*/
const monthTitleFormatter = new Intl.DateTimeFormat("he", {
  month: "long",
  year: "numeric",
});
const hebrewMonthFormatter = new Intl.DateTimeFormat("he-u-ca-hebrew", {
  month: "long",
});
const hebrewFullFormatter = new Intl.DateTimeFormat("he-u-ca-hebrew", {
  month: "long",
  year: "numeric",
});
const listDateFormatter = new Intl.DateTimeFormat("he", {
  day: "numeric",
  month: "numeric",
});

function toDateInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function CalendarPage({ initialDate }) {
  const [viewDate, setViewDate] = useState(() => {
    const base = initialDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1, 12);
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: events, isLoading, error, reload } = useApi(getEvents);

  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();

  const holidaysByDay = useMemo(
    () => getHolidaysForMonth(year, monthIndex),
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

  // רשימה ממוזגת של חגים + אירועים, ממוינת לפי יום בחודש
  const monthItems = useMemo(() => {
    const items = [];
    for (const [day, names] of holidaysByDay) {
      for (const name of names) items.push({ day, name, isHoliday: true });
    }
    for (const event of monthEvents) {
      items.push({ day: event.date.getDate(), name: event.name, event });
    }
    return items.sort((a, b) => a.day - b.day);
  }, [holidaysByDay, monthEvents]);

  const lastOfMonth = new Date(year, monthIndex + 1, 0, 12);
  const hebrewFirst = hebrewMonthFormatter.format(viewDate);
  const hebrewLast = hebrewFullFormatter.format(lastOfMonth);

  function moveMonth(step) {
    setViewDate(new Date(year, monthIndex + step, 1, 12));
  }

  async function handleSave(newEvent) {
    await addEvent(newEvent);
    setIsFormOpen(false);
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
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav-button"
          aria-label="החודש הקודם"
          onClick={() => moveMonth(-1)}
        >
          ›
        </button>
        <div className="calendar-header__titles">
          <h2 className="calendar-header__month">
            {monthTitleFormatter.format(viewDate)}
          </h2>
          <p className="calendar-header__hebrew">
            {hebrewFirst}–{hebrewLast}
          </p>
        </div>
        <button
          type="button"
          className="calendar-nav-button"
          aria-label="החודש הבא"
          onClick={() => moveMonth(1)}
        >
          ‹
        </button>
      </div>

      <MonthGrid
        year={year}
        monthIndex={monthIndex}
        holidaysByDay={holidaysByDay}
        eventsByDay={eventsByDay}
      />

      <div className="calendar-actions">
        <Button onClick={() => setIsFormOpen(true)}>+ הוספת אירוע</Button>
      </div>

      <div className="calendar-list">
        <h3>החודש בלוח</h3>
        {monthItems.length === 0 && (
          <p>אין חגים או אירועים החודש — אפשר להוסיף אירוע ראשון!</p>
        )}
        {monthItems.map((item, index) => (
          <div className="calendar-list__item" key={index}>
            <span className="calendar-list__date">
              {listDateFormatter.format(new Date(year, monthIndex, item.day))}
            </span>
            <span className="calendar-list__name">
              {item.name}
              {item.event?.reminder && " 🔔"}
            </span>
            {item.isHoliday ? (
              <span className="calendar-list__tag">חג</span>
            ) : (
              <button
                type="button"
                className="calendar-list__delete"
                aria-label={`מחיקת האירוע ${item.name}`}
                onClick={() => setDeleteTarget(item.event)}
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="אירוע חדש"
      >
        <EventForm onSave={handleSave} defaultDate={defaultFormDate} />
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
    </div>
  );
}

export default CalendarPage;
