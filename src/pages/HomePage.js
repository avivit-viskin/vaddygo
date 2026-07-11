import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import useApi from "../hooks/useApi";
import { loadDashboard } from "../services/dashboardService";
import { hebrewSchoolYearName } from "../services/schoolYear";
import AlertsList from "./home/AlertsList";
import CollectionCard from "./home/CollectionCard";
import CategoryList from "./home/CategoryList";
import StaffBirthdays from "./home/StaffBirthdays";
import "../styles/home.css";

/*
  HomePage — מסך הבית (UI_SPEC ס' 8): שם הגן והשנה, התראות, כרטיס גבייה
  עם החלפה בין יעד ליתרה, פירוקים, תשלומים לפי קטגוריות וימי הולדת של הצוות.
  הנתונים מהשרת; כשאינו זמין — סיכום מקומי מנתוני האשף (dashboardService).
*/
function HomePage() {
  const { data: dashboard, isLoading, error, reload } = useApi(loadDashboard);

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

  const alertCount = dashboard.alerts.length;

  return (
    <div className="home">
      <div className="home__header">
        <h2 className="home__title">
          {dashboard.ganName}{" "}
          <span className="home__year">{hebrewSchoolYearName(dashboard.year)}</span>
        </h2>
        <span className="home__bell" aria-label={`${alertCount} התראות`}>
          🔔
          {alertCount > 0 && <span className="home__badge">{alertCount}</span>}
        </span>
      </div>

      {!dashboard.fromServer && (
        <p className="home__offline">
          ⏳ הנתונים שמורים במכשיר שלך ויסונכרנו כשהשרת יעלה לאוויר
        </p>
      )}
      {error && <p className="home__offline">{error}</p>}

      <AlertsList alerts={dashboard.alerts} />
      <CollectionCard dashboard={dashboard} />
      <CategoryList categories={dashboard.byCategory} />
      <StaffBirthdays onChanged={reload} totalBudget={dashboard.collectionTarget} />
    </div>
  );
}

export default HomePage;
