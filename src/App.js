import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import BrandName from "./components/BrandName";
import BottomNav from "./components/BottomNav";
import HomePage from "./pages/HomePage";
import StudentsPage from "./pages/StudentsPage";
import StudentPaymentsPage from "./pages/StudentPaymentsPage";
import CalendarPage from "./pages/CalendarPage";
import GiftsPage from "./pages/GiftsPage";
import FilesPage from "./pages/FilesPage";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";
import { isOnboardingComplete } from "./services/onboardingService";

/*
  App — שלד האפליקציה: כותרת עליונה, אזור התוכן לפי הנתיב, וניווט תחתון קבוע.
  מסכי הפתיחה/כניסה/הרשמה מוצגים במסך מלא — בלי כותרת וניווט תחתון.
  כניסה ראשונה (עוד אין הגדרת גן) מופנית למסך הפתיחה.
*/
const FULL_SCREEN_ROUTES = ["/welcome", "/login", "/onboarding"];

function App() {
  const location = useLocation();
  const isFullScreen = FULL_SCREEN_ROUTES.includes(location.pathname);

  return (
    <div dir="rtl">
      {!isFullScreen && (
        <header className="app-header">
          <h1>
            <BrandName withHeart />
          </h1>
        </header>
      )}
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              isOnboardingComplete() ? (
                <HomePage />
              ) : (
                <Navigate to="/welcome" replace />
              )
            }
          />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingWizard />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route
            path="/students/:studentId/payments"
            element={<StudentPaymentsPage />}
          />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/gifts" element={<GiftsPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isFullScreen && <BottomNav />}
    </div>
  );
}

export default App;
