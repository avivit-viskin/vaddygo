import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import useApi from "../hooks/useApi";
import { loadDashboard } from "../services/dashboardService";
import {
  buildNotifications,
  loadNotifications,
  loadUnpaidStudents,
  applyReadState,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationsService";
import { hebrewSchoolYearName } from "../services/schoolYear";
import NotificationsPanel from "./home/NotificationsPanel";
import BulkReminderButton from "../components/BulkReminderButton";
import WelcomePopup from "../components/WelcomePopup";
import ExpenseAfterEventPrompt from "./home/ExpenseAfterEventPrompt";
import CollectionCard from "./home/CollectionCard";
import CategoryList from "./home/CategoryList";
import StaffBirthdays from "./home/StaffBirthdays";
import Modal from "../components/Modal";
import { getUser } from "../services/authService";
import "../styles/home.css";

/*
  HomePage — מסך הבית (UI_SPEC ס' 8): שם הגן והשנה, פעמון התראות, כרטיס גבייה
  עם החלפה בין יעד ליתרה, פירוקים, תשלומים לפי קטגוריות וימי הולדת של הצוות.
  הנתונים מהשרת; כשאינו זמין — סיכום מקומי מנתוני האשף (dashboardService).
  הפעמון פותח פאנל עם כל ההתראות (notificationsService); כשיש התראות הוא קופץ.
*/
function HomePage() {
  const { data: dashboard, isLoading, error, reload } = useApi(loadDashboard);
  const [panelOpen, setPanelOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unpaidStudents, setUnpaidStudents] = useState([]);

  // ההתראות: קודם מה שאפשר לחשב מיד (שרת + חגים), ואז השאר נטען ברקע
  // (אירועים, מתנות, מי לא שילם) — בלי לעכב את הצגת מסך הבית.
  useEffect(() => {
    if (!dashboard) {
      return undefined;
    }
    setNotifications(applyReadState(buildNotifications({ dashboard }, new Date())));
    let cancelled = false;
    loadNotifications(dashboard).then((list) => {
      if (!cancelled) {
        setNotifications(list);
      }
    });
    // התלמידים שטרם שילמו — לכפתור "תזכורת לחייבים" (משימה 9)
    loadUnpaidStudents()
      .then((list) => {
        if (!cancelled) {
          setUnpaidStudents(list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUnpaidStudents([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dashboard]);

  function handleMarkRead(id) {
    markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function handleMarkAllRead() {
    markAllNotificationsRead(notifications.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  if (isLoading) {
    return <Spinner text="טוען את מסך הבית..." />;
  }

  if (!dashboard) {
    return (
      <EmptyState icon="🌱" message="עוד לא הגדרנו את הגן — נתחיל?">
        <Link to="/welcome">
          <Button>להגדרת הגן</Button>
        </Link>
      </EmptyState>
    );
  }

  const count = notifications.filter((n) => !n.read).length; // לא-נקראו

  return (
    <div className="home">
      <WelcomePopup />
      <ExpenseAfterEventPrompt onRecorded={reload} />
      <div className="home__header">
        <h2 className="home__title">
          <button
            type="button"
            className="home__account-btn"
            onClick={() => setAccountOpen(true)}
            aria-label="פרטי החשבון"
          >
            {dashboard.ganName}
          </button>{" "}
          <span className="home__year">{hebrewSchoolYearName(dashboard.year)}</span>
        </h2>
        <button
          type="button"
          className={`home__bell${count > 0 ? " home__bell--ring" : ""}`}
          aria-label={`התראות (${count})`}
          onClick={() => setPanelOpen(true)}
        >
          🔔
          {count > 0 && <span className="home__badge">{count}</span>}
        </button>
      </div>

      {!dashboard.fromServer && (
        <p className="home__offline">
          ⏳ הנתונים שמורים במכשיר שלך ויסונכרנו כשהשרת יעלה לאוויר
        </p>
      )}
      {error && <p className="home__offline">{error}</p>}

      {unpaidStudents.length > 0 && (
        <div className="home__reminder">
          <BulkReminderButton unpaidStudents={unpaidStudents} />
        </div>
      )}

      <CollectionCard dashboard={dashboard} onExpenseChanged={reload} />
      <CategoryList categories={dashboard.byCategory} />
      <StaffBirthdays onChanged={reload} totalBudget={dashboard.collectionTarget} />

      <NotificationsPanel
        isOpen={panelOpen}
        notifications={notifications}
        onClose={() => setPanelOpen(false)}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />

      <Modal
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
        title="פרטי החשבון"
      >
        <p className="account-info__row">
          מוסד: <strong>{dashboard.ganName}</strong>
        </p>
        <p className="account-info__row">
          מחוברת עם המייל: <strong>{getUser()?.email || "—"}</strong>
        </p>
      </Modal>
    </div>
  );
}

export default HomePage;
