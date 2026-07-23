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
import {
  getBirthdays,
  birthdaysByDayForMonth,
} from "../services/birthdaysService";
import { hebrewDateLabel } from "../services/hebrewDate";
import { getStudents } from "../services/studentsService";
import { getOnboarding } from "../services/onboardingService";
import {
  getShabbatInfo,
  setShabbatInfo,
  shabbatWhatsappUrl,
  roleLabel,
} from "../services/shabbatParents";
import { isActiveReadOnly } from "../services/institutionsService";
import MonthGrid from "./calendar/MonthGrid";
import EventForm from "./calendar/EventForm";
import HolidaysSection from "./calendar/HolidaysSection";
import HolidayBudgetDialog from "./calendar/HolidayBudgetDialog";
import Modal from "../components/Modal";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import WhatsAppIcon from "../components/WhatsAppIcon";
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

function CalendarPage({ initialDate }) {
  // "צופה" — לצפייה בלבד: מסתירים הוספה/עריכה/מחיקה של אירועים ותקציבי חגים
  const readOnly = isActiveReadOnly();
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
  // ימי-הולדת של הצוות והתלמידים — נטענים אוטומטית ומסונכרנים ללוח
  const { data: birthdays } = useApi(getBirthdays);
  // התלמידים — לבחירת "אבא/אמא של שבת" (ממלא טלפון ומין אוטומטית)
  const { data: students } = useApi(getStudents);
  const ganName = getOnboarding()?.ganName || "";

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

  // יום ההולדת חוזר כל שנה — הפילוח לפי חודש בלבד (בלי שנת הלידה)
  const birthdaysByDay = useMemo(
    () => birthdaysByDayForMonth(birthdays || [], monthIndex),
    [birthdays, monthIndex]
  );

  // רשימה שטוחה וממוינת של ימי-ההולדת בחודש המוצג (לתצוגת המדור מתחת ללוח)
  const monthBirthdays = useMemo(() => {
    const list = [];
    for (const [day, items] of birthdaysByDay.entries()) {
      for (const b of items) {
        list.push({ day, ...b });
      }
    }
    return list.sort((a, b) => a.day - b.day);
  }, [birthdaysByDay]);

  const monthEvents = useMemo(() => {
    return (events || [])
      .map((event) => {
        // התפקיד (אבא/אמא) נשמר מקומית לכל אירוע — ממוזג חזרה כאן
        const info = getShabbatInfo(event.id);
        return {
          ...event,
          date: parseEventDate(event.eventDate),
          shabbatRole: info?.role || event.shabbatRole || "dad",
          studentId: info?.studentId ?? event.studentId ?? null,
        };
      })
      .filter(
        (event) =>
          event.date.getFullYear() === year &&
          event.date.getMonth() === monthIndex
      )
      .sort((a, b) => a.date - b.date);
  }, [events, year, monthIndex]);

  // אירועי "אבא/אמא של שבת" של החודש — למדור הייעודי בתחתית
  const shabbatEvents = useMemo(
    () => monthEvents.filter((event) => event.shareWithParent),
    [monthEvents]
  );
  // "האירועים שלי" מציג רק אירועים רגילים — אבא/אמא של שבת נמצאים במדור שלהם
  const regularEvents = useMemo(
    () => monthEvents.filter((event) => !event.shareWithParent),
    [monthEvents]
  );

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
      birthdays: birthdaysByDay.get(day) || [],
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

  // שומר את תפקיד "אבא/אמא של שבת" (או מנקה אותו אם האירוע כבר לא מסומן)
  function saveShabbatRole(id, fields) {
    setShabbatInfo(
      id,
      fields.shareWithParent
        ? { role: fields.shabbatRole, studentId: fields.studentId }
        : null
    );
  }

  async function handleSave(newEvent) {
    const saved = await addEvent(newEvent);
    saveShabbatRole(saved.id, newEvent);
    setIsFormOpen(false);
    await reload();
  }

  async function handleUpdate(fields) {
    await updateEvent(editTarget.id, fields);
    saveShabbatRole(editTarget.id, fields);
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
            birthdaysByDay={birthdaysByDay}
            roshChodeshDays={roshChodeshDays}
            onDayClick={openDayView}
          />
        </div>

        {/* "צופה" — לצפייה בלבד: בלי הוספת אירוע */}
        {readOnly ? (
          <aside className="calendar-side">
            <p>אפשר ללחוץ על יום בלוח כדי לראות את האירועים שלו 🙂</p>
          </aside>
        ) : (
          <aside className="calendar-side">
            <Button variant="brand" onClick={() => openAddForm(defaultFormDate)}>
              + הוספת אירוע
            </Button>
            <p>אפשר ללחוץ על יום בלוח כדי לראות את האירועים שלו ולהוסיף/לערוך, או על הכפתור להוספה מהירה 🙂</p>
          </aside>
        )}
      </div>

      {/* מדור 2: חגים החודש + תקציב לכל חג */}
      <HolidaysSection
        year={year}
        monthIndex={monthIndex}
        occurrences={holidayOccurrences}
        budgets={budgets || {}}
        onEditBudget={setBudgetTarget}
        readOnly={readOnly}
      />

      {/* מדור 3: האירועים שלי */}
      <section className="calendar-list" aria-label="האירועים שלי החודש">
        <h3>האירועים שלי</h3>
        {regularEvents.length === 0 && (
          <p>אין אירועים החודש — אפשר להוסיף את הראשון!</p>
        )}
        {regularEvents.map((event) => (
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
            {/* "צופה" — לצפייה בלבד: בלי עריכה/מחיקה */}
            {!readOnly && (
              <>
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
              </>
            )}
          </div>
        ))}
      </section>

      {/* מדור 4: ימי הולדת החודש — צוות ותלמידים (מסונכרן אוטומטית) */}
      <section className="calendar-list" aria-label="ימי הולדת החודש">
        <h3>ימי הולדת החודש 🎂</h3>
        {monthBirthdays.length === 0 ? (
          <p>
            אין ימי הולדת בחודש זה. ימי ההולדת מופיעים בלוח בתאריך שלהם — אפשר
            לגלול לחודש של יום ההולדת כדי לראות אותו 🙂
          </p>
        ) : (
          monthBirthdays.map((b) => (
            <div
              className="calendar-list__item"
              key={`bday-${b.type}-${b.name}-${b.day}`}
            >
              <span className="calendar-list__date">
                {b.day}.{monthIndex + 1}
              </span>
              <span className="calendar-list__name">
                🎂 {b.name}
                {b.type === "staff" && " · צוות"}
              </span>
            </div>
          ))
        )}
      </section>

      {/* מדור: אבא ואמא של שבת — לפי אירועים שסומנו */}
      <section className="calendar-list" aria-label="אבא ואמא של שבת">
        <h3>אבא ואמא של שבת 👪</h3>
        <p className="calendar-list__hint">
          אפשר להוסיף אבא ואמא של שבת לפי ההוספה באירוע — מסמנים אירוע כ"אבא/אמא
          של שבת", והוא מופיע כאן עם כפתור לשליחת הודעה להורה 🙂
        </p>
        {shabbatEvents.length === 0 ? (
          <p>
            עדיין אין. כשמוסיפים אירוע ומסמנים "אבא/אמא של שבת", הוא יופיע כאן.
          </p>
        ) : (
          shabbatEvents.map((event) => (
            <div className="calendar-list__item" key={`shabbat-${event.id}`}>
              <span className="calendar-list__date">
                {listDateFormatter.format(event.date)}
              </span>
              <span className="calendar-list__name">
                👪 {event.name?.trim() || roleLabel(event.shabbatRole)}
              </span>
              {event.parentPhone && (
                <a
                  className="calendar-list__send"
                  href={shabbatWhatsappUrl(event, ganName)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`שליחת הודעה בוואטסאפ להורה של ${
                    event.name?.trim() || roleLabel(event.shabbatRole)
                  }`}
                >
                  <WhatsAppIcon size={18} /> שליחת הודעה
                </a>
              )}
            </div>
          ))
        )}
      </section>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="אירוע חדש"
      >
        <EventForm
          onSave={handleSave}
          defaultDate={addDate || defaultFormDate}
          students={students || []}
        />
      </Modal>

      <Modal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="עריכת אירוע"
      >
        {editTarget && (
          <EventForm
            onSave={handleUpdate}
            initialEvent={editTarget}
            students={students || []}
          />
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
            {dayView.holidays.length === 0 &&
            dayView.events.length === 0 &&
            dayView.birthdays.length === 0 ? (
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

                {/* ימי-הולדת — מסונכרנים אוטומטית מהצוות/תלמידים, בלי עריכה/מחיקה */}
                {dayView.birthdays.map((b) => (
                  <li
                    key={`bday-${b.type}-${b.name}`}
                    className="calendar-day-view__item calendar-day-view__item--birthday"
                  >
                    <span className="calendar-day-view__name">🎂 {b.name}</span>
                    <span className="calendar-day-view__tag">
                      {b.type === "staff" ? "יום הולדת · צוות" : "יום הולדת"}
                    </span>
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
                    {/* "צופה" — לצפייה בלבד: בלי עריכה/מחיקה */}
                    {!readOnly && (
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
                    )}
                  </li>
                ))}
              </ul>
            )}

            {!readOnly && (
              <Button variant="brand" onClick={addFromDayView}>
                + הוספת אירוע ליום זה
              </Button>
            )}
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
