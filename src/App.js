import { useState, useEffect } from "react";
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
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";
import TeamSetupPage from "./pages/TeamSetupPage";
import SubscriptionExpiredPage from "./pages/SubscriptionExpiredPage";
import AiAssistantPage from "./pages/AiAssistantPage";
import PurchasePage from "./pages/PurchasePage";
import CheckoutPage from "./pages/CheckoutPage";
import CardReturnPage from "./pages/CardReturnPage";
import CollectionSettingsPage from "./pages/CollectionSettingsPage";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import TermsPage from "./pages/legal/TermsPage";
import AccessibilityPage from "./pages/legal/AccessibilityPage";
import CookiesPage from "./pages/legal/CookiesPage";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import AccessibilityWidget from "./components/AccessibilityWidget";
import { applyAnalyticsConsent } from "./services/analytics";
import { hasAnalyticsConsent } from "./services/cookieConsentService";
import { applyA11ySettings } from "./services/accessibility";
import { isOnboardingComplete } from "./services/onboardingService";
import {
  isAuthenticated,
  hasVisitedBefore,
  isSubscriptionExpired,
} from "./services/authService";
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
  "/forgot-password",
  "/onboarding",
  "/team-setup",
  "/subscription-expired",
  "/pay/return",
  ...LEGAL_ROUTES,
];
// נתיבים פתוחים ללא הזדהות (כאן מקבלים/מפיקים את ה-token, העמודים המשפטיים,
// ועמוד החזרה מסליקת האשראי — ההורה שמשלם אינו מחובר לאפליקציה)
const PUBLIC_ROUTES = [
  "/welcome",
  "/login",
  "/register",
  "/forgot-password",
  "/subscription-expired",
  "/pay/return",
  ...LEGAL_ROUTES,
];
// מסכי הזדהות — משתמשת שכבר מחוברת לא צריכה לראות אותם שוב (נשלחת הביתה)
const AUTH_ENTRY_ROUTES = ["/welcome", "/login", "/register"];

function App() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // בעליית האפליקציה: מפעילים מעקב רק אם אושרו עוגיות מדידה, ומחילים את
  // הגדרות הנגישות השמורות (גודל טקסט/ניגודיות וכו').
  useEffect(() => {
    applyAnalyticsConsent(hasAnalyticsConsent());
    applyA11ySettings();
  }, []);
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
        <CookieConsent />
        <AccessibilityWidget />
      </div>
    );
  }

  // כבר מחוברת ונחתה על מסך כניסה/פתיחה/הרשמה (למשל קיצור-דרך או כתובת אחרונה
  // שהדפדפן פתח מחדש) → ישר הביתה, בלי לבקש להתחבר שוב.
  if (isAuthenticated() && AUTH_ENTRY_ROUTES.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  // תקופת הניסיון/המנוי פגה → נעילה: מפנים למסך החידוש. מסכים ציבוריים (כולל
  // מסך החידוש עצמו) פטורים, כדי לא ליצור לולאת הפניה.
  if (isAuthenticated() && !isPublic && isSubscriptionExpired()) {
    return <Navigate to="/subscription-expired" replace />;
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
          <Route path="/pay/return" element={<CardReturnPage />} />
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
      <CookieConsent />
      <AccessibilityWidget />
    </div>
  );
}

export default App;
