import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import BrandName from "./components/BrandName";
import BottomNav from "./components/BottomNav";
import SideMenu from "./components/SideMenu";
import AiFab from "./components/AiFab";
import HomePage from "./pages/HomePage";
import StudentsPage from "./pages/StudentsPage";
import StudentPaymentsPage from "./pages/StudentPaymentsPage";
import CalendarPage from "./pages/CalendarPage";
import GiftsPage from "./pages/GiftsPage";
import FilesPage from "./pages/FilesPage";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";
import AiAssistantPage from "./pages/AiAssistantPage";
import PurchasePage from "./pages/PurchasePage";
import { isOnboardingComplete } from "./services/onboardingService";
import { isAuthenticated } from "./services/authService";
import { getActiveInstitution } from "./services/institutionsService";

/*
  App — שלד האפליקציה: כותרת עליונה, אזור התוכן לפי הנתיב, וניווט תחתון קבוע.
  מסכי הפתיחה/כניסה/הרשמה מוצגים במסך מלא — בלי כותרת וניווט תחתון.
  משתמשת שאינה מחוברת מופנית למסך הפתיחה; מחוברת בלי הגדרת גן — לאשף.
*/
const FULL_SCREEN_ROUTES = ["/welcome", "/login", "/register", "/onboarding"];
// נתיבים פתוחים ללא הזדהות (כאן מקבלים/מפיקים את ה-token)
const PUBLIC_ROUTES = ["/welcome", "/login", "/register"];

function App() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // מסך רכישה/הפעלת מוסד מוצג במסך מלא (בלי כותרת וניווט)
  const isPurchase = location.pathname.startsWith("/institutions/");
  const isFullScreen =
    FULL_SCREEN_ROUTES.includes(location.pathname) || isPurchase;
  const isPublic = PUBLIC_ROUTES.includes(location.pathname);
  const activeInstitution = getActiveInstitution();

  // הגנת ניתוב: כל מסך שאינו ציבורי דורש הזדהות
  if (!isAuthenticated() && !isPublic) {
    return (
      <div dir="rtl">
        <main className="app-main">
          <Routes>
            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div dir="rtl">
      {!isFullScreen && (
        <header className="app-header">
          <button
            type="button"
            className="app-header__menu"
            aria-label="תפריט"
            onClick={() => setIsMenuOpen(true)}
          >
            ☰
          </button>
          <h1>
            <BrandName withHeart />
          </h1>
          {activeInstitution && (
            <span className="app-header__institution">{activeInstitution.name}</span>
          )}
        </header>
      )}
      {!isFullScreen && (
        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      )}
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              isOnboardingComplete() ? (
                <HomePage />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            }
          />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<OnboardingWizard />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route
            path="/students/:studentId/payments"
            element={<StudentPaymentsPage />}
          />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/gifts" element={<GiftsPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/assistant" element={<AiAssistantPage />} />
          <Route
            path="/institutions/:id/purchase"
            element={<PurchasePage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isFullScreen && location.pathname !== "/assistant" && <AiFab />}
      {!isFullScreen && <BottomNav />}
    </div>
  );
}

export default App;
