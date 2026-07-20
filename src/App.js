import { useState } from "react";
import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import Logo from "./components/Logo";
import InstitutionAvatar from "./components/InstitutionAvatar";
import BottomNav from "./components/BottomNav";
import SideMenu from "./components/SideMenu";
import WhatsAppFab from "./components/WhatsAppFab";
import PullToRefresh from "./components/PullToRefresh";
import ToastContainer from "./components/Toast";
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
import TeamSetupPage from "./pages/TeamSetupPage";
import SubscriptionExpiredPage from "./pages/SubscriptionExpiredPage";
import AiAssistantPage from "./pages/AiAssistantPage";
import PurchasePage from "./pages/PurchasePage";
import CheckoutPage from "./pages/CheckoutPage";
import CollectionSettingsPage from "./pages/CollectionSettingsPage";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import TermsPage from "./pages/legal/TermsPage";
import AccessibilityPage from "./pages/legal/AccessibilityPage";
import CookiesPage from "./pages/legal/CookiesPage";
import Footer from "./components/Footer";
import { isOnboardingComplete } from "./services/onboardingService";
import { isAuthenticated, hasVisitedBefore } from "./services/authService";
import { getActiveInstitution } from "./services/institutionsService";

/*
  App — שלד האפליקציה: כותרת עליונה, אזור התוכן לפי הנתיב, וניווט תחתון קבוע.
  מסכי הפתיחה/כניסה/הרשמה מוצגים במסך מלא — בלי כותרת וניווט תחתון.
  משתמשת שאינה מחוברת מופנית למסך הפתיחה; מחוברת בלי הגדרת גן — לאשף.
*/
const LEGAL_ROUTES = ["/privacy", "/terms", "/accessibility", "/cookies"];
const FULL_SCREEN_ROUTES = [
  "/welcome",
  "/login",
  "/register",
  "/onboarding",
  "/team-setup",
  "/subscription-expired",
  ...LEGAL_ROUTES,
];
// נתיבים פתוחים ללא הזדהות (כאן מקבלים/מפיקים את ה-token, וגם העמודים המשפטיים)
const PUBLIC_ROUTES = [
  "/welcome",
  "/login",
  "/register",
  "/subscription-expired",
  ...LEGAL_ROUTES,
];
// מסכי הזדהות — משתמשת שכבר מחוברת לא צריכה לראות אותם שוב (נשלחת הביתה)
const AUTH_ENTRY_ROUTES = ["/welcome", "/login", "/register"];

function App() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // מסך רכישה/הפעלת מוסד מוצג במסך מלא (בלי כותרת וניווט)
  const isPurchase = location.pathname.startsWith("/institutions/");
  const isFullScreen =
    FULL_SCREEN_ROUTES.includes(location.pathname) || isPurchase;
  const isPublic = PUBLIC_ROUTES.includes(location.pathname);
  const activeInstitution = getActiveInstitution();

  // הגנת ניתוב: כל מסך שאינו ציבורי דורש הזדהות.
  // משתמש חדש (מכשיר שטרם נכנסו אליו) → מסך הברוכים-הבאים.
  // משתמש חוזר (כבר נרשם/התחבר כאן) → ישר למסך הכניסה.
  if (!isAuthenticated() && !isPublic) {
    const entry = hasVisitedBefore() ? "/login" : "/welcome";
    return (
      <div dir="rtl">
        <main className="app-main">
          <Routes>
            <Route path="*" element={<Navigate to={entry} replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  // כבר מחוברת ונחתה על מסך כניסה/פתיחה/הרשמה (למשל קיצור-דרך או כתובת אחרונה
  // שהדפדפן פתח מחדש) → ישר הביתה, בלי לבקש להתחבר שוב.
  if (isAuthenticated() && AUTH_ENTRY_ROUTES.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div dir="rtl">
      <ToastContainer />
      {!isFullScreen && <PullToRefresh />}
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
            <Link to="/" className="app-header__logo-link">
              <Logo />
            </Link>
          </h1>
          {activeInstitution && (
            <InstitutionAvatar name={activeInstitution.name} />
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
          <Route
            path="/subscription-expired"
            element={<SubscriptionExpiredPage />}
          />
          <Route path="/onboarding" element={<OnboardingWizard />} />
          <Route path="/team-setup" element={<TeamSetupPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route
            path="/students/:studentId/payments"
            element={<StudentPaymentsPage />}
          />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/gifts" element={<GiftsPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/collection-settings" element={<CollectionSettingsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/assistant" element={<AiAssistantPage />} />
          <Route path="/pay" element={<CheckoutPage />} />
          <Route
            path="/institutions/:id/purchase"
            element={<PurchasePage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {!isFullScreen && <Footer />}
      </main>
      {!isFullScreen && <WhatsAppFab />}
      {!isFullScreen && <BottomNav />}
    </div>
  );
}

export default App;
