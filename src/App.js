import { useState, useEffect, useRef, lazy, Suspense } from "react";
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
import Spinner from "./components/Spinner";
/*
  טעינת מסכים לפי דרישה (code splitting).

  עד היום כל מסכי המערכת נארזו לקובץ אחד, כך שהורה שפותח קישור לסקר או לקטלוג
  בנייד הוריד גם את מסכי הגבייה, הספקים והדוחות — שלא ישמשו אותו לעולם. עכשיו
  כל מסך הוא חבילה נפרדת שנטענת רק כשנכנסים אליו.

  **בטעינה מיידית (לא lazy)** נשארים רק המסכים של הפתיחה — מסך הבית ומסכי
  הכניסה/הרשמה — כדי שהמסך הראשון לא יהבהב בספינר.
*/
import HomePage from "./pages/HomePage";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import AccessibilityWidget from "./components/AccessibilityWidget";
import AddToHomeScreen from "./components/AddToHomeScreen";
import { applyAnalyticsConsent, trackPageView } from "./services/analytics";
import { hasAnalyticsConsent } from "./services/cookieConsentService";
import { applyA11ySettings } from "./services/accessibility";
import {
  isOnboardingComplete,
  restoreOnboardingFromServer,
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
import { isRouteLocked } from "./services/plan";
import "./styles/readonly.css";

// ── מסכי הוועד (נטענים בכניסה אליהם מהניווט התחתון/התפריט) ──
const StudentsPage = lazy(() => import("./pages/StudentsPage"));
const StudentPaymentsPage = lazy(() => import("./pages/StudentPaymentsPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const GiftsPage = lazy(() => import("./pages/GiftsPage"));
const FilesPage = lazy(() => import("./pages/FilesPage"));
const OnboardingWizard = lazy(() => import("./pages/onboarding/OnboardingWizard"));
const TeamSetupPage = lazy(() => import("./pages/TeamSetupPage"));
const CollectionSettingsPage = lazy(() => import("./pages/CollectionSettingsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const SubscriptionExpiredPage = lazy(() => import("./pages/SubscriptionExpiredPage"));
const PurchasePage = lazy(() => import("./pages/PurchasePage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const CardReturnPage = lazy(() => import("./pages/CardReturnPage"));

// ── כלי הפרו (נכנסים אליהם מדי פעם, לא בכל שימוש) ──
const AiAssistantPage = lazy(() => import("./pages/AiAssistantPage"));
const UpgradePage = lazy(() => import("./pages/UpgradePage"));
const UsageStatsPage = lazy(() => import("./pages/UsageStatsPage"));
const AnnualReportPage = lazy(() => import("./pages/AnnualReportPage"));
const RemindersPage = lazy(() => import("./pages/RemindersPage"));
const PollsPage = lazy(() => import("./pages/PollsPage"));
const BackupPage = lazy(() => import("./pages/BackupPage"));
const BrandingPage = lazy(() => import("./pages/BrandingPage"));
const ContactsPage = lazy(() => import("./pages/ContactsPage"));

// ── פורטל הספקים — עולם שלם שהוועד לעולם לא פותח (וההפך) ──
const SupplierEditPage = lazy(() => import("./pages/SupplierEditPage"));
const SupplierWelcomePage = lazy(() => import("./pages/SupplierWelcomePage"));
const SupplierRegisterPage = lazy(() => import("./pages/SupplierRegisterPage"));
const SupplierLoginPage = lazy(() => import("./pages/SupplierLoginPage"));
const SupplierForgotPasswordPage = lazy(() =>
  import("./pages/SupplierForgotPasswordPage")
);
const DirectoryPage = lazy(() => import("./pages/DirectoryPage"));

// ── מסכים ציבוריים שהורים פותחים מקישור (כאן החיסכון הגדול ביותר) ──
const JoinPage = lazy(() => import("./pages/JoinPage"));
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const PublicPollPage = lazy(() => import("./pages/PublicPollPage"));

// ── עמודים משפטיים ודף הנחיתה ──
const PrivacyPage = lazy(() => import("./pages/legal/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/legal/TermsPage"));
const AccessibilityPage = lazy(() => import("./pages/legal/AccessibilityPage"));
const CookiesPage = lazy(() => import("./pages/legal/CookiesPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

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
  // משתמשת מחוברת שאין לה עותק מקומי של הגדרת הגן — קודם משחזרים מהשרת ורק אז
  // מחליטים לאן לנתב (בית/אשף), כדי לא להבהב לאשף ההרשמה לפני שברור אם יש לה גן.
  const [booting, setBooting] = useState(
    () => isAuthenticated() && !isOnboardingComplete()
  );

  // בעליית האפליקציה: מפעילים מעקב רק אם אושרו עוגיות מדידה, ומחילים את
  // הגדרות הנגישות השמורות. למשתמשת מחוברת: אם אין עותק מקומי של הגדרת הגן —
  // משחזרים מהשרת (כדי לא לזרוק משתמשת חוזרת עם גן לאשף ההרשמה), ואז מסנכרנים
  // את המוסדות וההרשאות (למשל "צופה") — הכול לפני הסרת מסך הטעינה.
  useEffect(() => {
    applyAnalyticsConsent(hasAnalyticsConsent());
    applyA11ySettings();
    if (!isAuthenticated()) {
      return undefined;
    }
    let alive = true;
    (async () => {
      try {
        if (!isOnboardingComplete()) {
          await restoreOnboardingFromServer();
        }
        await syncInstitutionsFromServer();
      } catch {
        // שקט — נשארים עם מה שקיים מקומית
      } finally {
        if (alive) {
          setBooting(false);
          setSyncTick((n) => n + 1);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // מעקב צפיות עמוד בכל מעבר מסך (SPA). מדלגים על הרינדור הראשון כי צפיית העמוד
  // הראשונה כבר נשלחת ברגע אישור העוגיות (בתוך analytics.load). לא עושה כלום עד
  // שאושרו עוגיות מדידה.
  const firstView = useRef(true);
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    trackPageView(location.pathname + location.search);
  }, [location]);

  // מסך רכישה/הפעלת מוסד מוצג במסך מלא (בלי כותרת וניווט)
  const isPurchase = location.pathname.startsWith("/institutions/");
  // עמוד הצטרפות לגן דרך קישור הזמנה (/join/:token) — ציבורי ובמסך מלא
  const isJoin = location.pathname.startsWith("/join/");
  // עמוד עריכה עצמית לספק (/supplier/:token) — ציבורי ובמסך מלא, כמו /join
  const isSupplierEdit = location.pathname.startsWith("/supplier/");
  // קטלוג ציבורי של ספק (/catalog/:id) — ציבורי ובמסך מלא
  const isCatalog = location.pathname.startsWith("/catalog/");
  // סקר ציבורי להורים (/poll/:token) — ההורים אינם מחוברים, כמו /join ו-/catalog
  const isPublicPoll = location.pathname.startsWith("/poll/");
  const isFullScreen =
    FULL_SCREEN_ROUTES.includes(location.pathname) ||
    isPurchase ||
    isJoin ||
    isSupplierEdit ||
    isCatalog ||
    isPublicPoll;
  // מסך הכניסה מקבל רקע מונפש במסך מלא — מנטרלים את מסגרת ה-app-main (רוחב/ריפוד)
  const isLoginRoute = location.pathname === "/login";
  const isPublic =
    PUBLIC_ROUTES.includes(location.pathname) ||
    isJoin ||
    isSupplierEdit ||
    isCatalog ||
    isPublicPoll;
  const activeInstitution = getActiveInstitution();

  // הגנת ניתוב: כל מי שאינו מחובר ומגיע לכתובת שאינה ציבורית → דף הנחיתה
  // השיווקי (הכתובת הראשית). ממנו נכנסים להרשמה (/register) או לכניסה (/login).
  if (!isAuthenticated() && !isPublic) {
    return (
      <div dir="rtl">
        <Suspense fallback={<Spinner text="רגע, טוענים…" />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <CookieConsent />
        <AccessibilityWidget />
      </div>
    );
  }

  // עדיין משחזרים נתונים למשתמשת מחוברת שאין לה עותק מקומי — טעינה קצרה במקום
  // הבהוב לאשף ההרשמה, עד שברור אם יש לה גן בשרת (→ בית) או לא (→ אשף).
  if (booting) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner text="רגע, טוענים את הנתונים שלך…" />
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

  // עמוד פרו (דוחות/תזכורות/סקרים/גיבוי/מיתוג/קשרים/עוזרת AI) למי שאינה מנויה →
  // מפנים לעמוד השדרוג, שם אפשר לשדרג/לפתוח פרו.
  if (isAuthenticated() && !isPublic && isRouteLocked(location.pathname)) {
    return <Navigate to="/upgrade" replace />;
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
        {/* מסכים נטענים לפי דרישה — עד שהחבילה מגיעה מוצג ספינר קצר */}
        <Suspense fallback={<Spinner text="רגע, טוענים…" />}>
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
          {/* סקר ציבורי — כאן ההורים עונים; אין להם חשבון במערכת */}
          <Route path="/poll/:token" element={<PublicPollPage />} />
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
          {/* נתוני שימוש — למנהלת VaddyGo; העמוד עצמו חוסם מי שאינה SuperAdmin,
              והשרת אוכף זאת שוב ב-[Authorize(Roles = "SuperAdmin")] */}
          <Route path="/admin/usage" element={<UsageStatsPage />} />
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
        </Suspense>
        {!isFullScreen && <Footer />}
      </main>
      {!isFullScreen && <WhatsAppFab />}
      {!isFullScreen && <BottomNav />}
      {!isFullScreen && <AddToHomeScreen />}
      <CookieConsent />
      <AccessibilityWidget />
    </div>
  );
}

export default App;
