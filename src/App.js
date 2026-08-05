import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import Logo from "./components/Logo";
import Icon from "./components/Icon";
import InstitutionAvatar from "./components/InstitutionAvatar";
import BottomNav from "./components/BottomNav";
import SideMenu from "./components/SideMenu";
import WhatsAppFab from "./components/WhatsAppFab";
import PullToRefresh from "./components/PullToRefresh";
import PageTransition from "./components/PageTransition";
import ToastContainer from "./components/Toast";
import ImportJobBanner from "./components/ImportJobBanner";
import HomePage from "./pages/HomePage";
import StudentsPage from "./pages/StudentsPage";
import StudentPaymentsPage from "./pages/StudentPaymentsPage";
import CalendarPage from "./pages/CalendarPage";
import GiftsPage from "./pages/GiftsPage";
import FilesPage from "./pages/FilesPage";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import JoinPage from "./pages/JoinPage";
import SupplierEditPage from "./pages/SupplierEditPage";
import SupplierWelcomePage from "./pages/SupplierWelcomePage";
import SupplierRegisterPage from "./pages/SupplierRegisterPage";
import CatalogPage from "./pages/CatalogPage";
import DirectoryPage from "./pages/DirectoryPage";
import SupplierLoginPage from "./pages/SupplierLoginPage";
import SupplierForgotPasswordPage from "./pages/SupplierForgotPasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";
import TeamSetupPage from "./pages/TeamSetupPage";
import SubscriptionExpiredPage from "./pages/SubscriptionExpiredPage";
import AiAssistantPage from "./pages/AiAssistantPage";
import UpgradePage from "./pages/UpgradePage";
import AnnualReportPage from "./pages/AnnualReportPage";
import RemindersPage from "./pages/RemindersPage";
import PollsPage from "./pages/PollsPage";
import BackupPage from "./pages/BackupPage";
import BrandingPage from "./pages/BrandingPage";
import ContactsPage from "./pages/ContactsPage";
import PurchasePage from "./pages/PurchasePage";
import CheckoutPage from "./pages/CheckoutPage";
import CardReturnPage from "./pages/CardReturnPage";
import CollectionSettingsPage from "./pages/CollectionSettingsPage";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import TermsPage from "./pages/legal/TermsPage";
import AccessibilityPage from "./pages/legal/AccessibilityPage";
import CookiesPage from "./pages/legal/CookiesPage";
import LandingPage from "./pages/LandingPage";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import AccessibilityWidget from "./components/AccessibilityWidget";
import { applyAnalyticsConsent } from "./services/analytics";
import { hasAnalyticsConsent } from "./services/cookieConsentService";
import { applyA11ySettings } from "./services/accessibility";
import {
  isOnboardingComplete,
  syncInstitutionsFromServer,
} from "./services/onboardingService";
import {
  isAuthenticated,
  isSubscriptionExpired,
} from "./services/authService";
import {
  getActiveInstitution,
  isActiveReadOnly,
} from "./services/institutionsService";
import "./styles/readonly.css";

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
  "/supplier-login",
  "/supplier-forgot-password",
  "/suppliers",
  "/supplier-register",
  "/directory",
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
  "/supplier-login",
  "/supplier-forgot-password",
  "/suppliers",
  "/supplier-register",
  "/directory",
  ...LEGAL_ROUTES,
];
// מסכי הזדהות — משתמשת שכבר מחוברת לא צריכה לראות אותם שוב (נשלחת הביתה)
const AUTH_ENTRY_ROUTES = ["/welcome", "/login", "/register"];

function App() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // מונה שמאלץ רינדור מחדש אחרי סנכרון המוסדות (כדי שההרשאה המעודכנת תיושם)
  const [, setSyncTick] = useState(0);

  // בעליית האפליקציה: מפעילים מעקב רק אם אושרו עוגיות מדידה, ומחילים את
  // הגדרות הנגישות השמורות. בנוסף — מסנכרנים את המוסדות וההרשאות מהשרת בכל
  // טעינה, כך שגם משתמש שכבר מחובר יקבל את ההרשאה העדכנית (למשל "צופה")
  // בלי צורך להתחבר מחדש, וכפתורי העריכה ייחסמו בהתאם.
  useEffect(() => {
    applyAnalyticsConsent(hasAnalyticsConsent());
    applyA11ySettings();
    if (isAuthenticated()) {
      syncInstitutionsFromServer()
        .then(() => setSyncTick((n) => n + 1))
        .catch(() => {});
    }
  }, []);
  // מסך רכישה/הפעלת מוסד מוצג במסך מלא (בלי כותרת וניווט)
  const isPurchase = location.pathname.startsWith("/institutions/");
  // עמוד הצטרפות לגן דרך קישור הזמנה (/join/:token) — ציבורי ובמסך מלא
  const isJoin = location.pathname.startsWith("/join/");
  // עמוד עריכה עצמית לספק (/supplier/:token) — ציבורי ובמסך מלא, כמו /join
  const isSupplierEdit = location.pathname.startsWith("/supplier/");
  // קטלוג ציבורי של ספק (/catalog/:id) — ציבורי ובמסך מלא
  const isCatalog = location.pathname.startsWith("/catalog/");
  const isFullScreen =
    FULL_SCREEN_ROUTES.includes(location.pathname) ||
    isPurchase ||
    isJoin ||
    isSupplierEdit ||
    isCatalog;
  // מסך הכניסה מקבל רקע מונפש במסך מלא — מנטרלים את מסגרת ה-app-main (רוחב/ריפוד)
  const isLoginRoute = location.pathname === "/login";
  const isPublic =
    PUBLIC_ROUTES.includes(location.pathname) ||
    isJoin ||
    isSupplierEdit ||
    isCatalog;
  const activeInstitution = getActiveInstitution();

  // הגנת ניתוב: כל מי שאינו מחובר ומגיע לכתובת שאינה ציבורית → דף הנחיתה
  // השיווקי (הכתובת הראשית). ממנו נכנסים להרשמה (/register) או לכניסה (/login).
  if (!isAuthenticated() && !isPublic) {
    return (
      <div dir="rtl">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
      {/* באנר ייבוא גלובלי — ממשיך להופיע בכל דף באתר עד שהמשימה נגמרת. בפורטל
          הספק (isSupplierEdit) יש באנר משלו, ולכן שם לא מכפילים */}
      {!isSupplierEdit && <ImportJobBanner />}
      <PageTransition disabled={isFullScreen} />
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
      {!isFullScreen && isActiveReadOnly() && (
        <div className="readonly-banner" role="status">
          <Icon name="eye" size={16} /> מצב צפייה בלבד — יש לך הרשאת צפייה בגן
          הזה, בלי אפשרות לערוך.
        </div>
      )}
      <main className={`app-main${isLoginRoute ? " app-main--login" : ""}`}>
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
          <Route path="/join/:token" element={<JoinPage />} />
          <Route path="/supplier/:token" element={<SupplierEditPage />} />
          <Route path="/catalog/:id" element={<CatalogPage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/supplier-login" element={<SupplierLoginPage />} />
          <Route path="/suppliers" element={<SupplierWelcomePage />} />
          <Route
            path="/supplier-register"
            element={<SupplierRegisterPage />}
          />
          <Route
            path="/supplier-forgot-password"
            element={<SupplierForgotPasswordPage />}
          />
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
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/annual-report" element={<AnnualReportPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/polls" element={<PollsPage />} />
          <Route path="/backup" element={<BackupPage />} />
          <Route path="/branding" element={<BrandingPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
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
