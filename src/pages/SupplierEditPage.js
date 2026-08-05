import { useCallback, useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import {
  getVendorByToken,
  updateVendorByToken,
  setVendorCredentials,
  changeVendorPassword,
  requestVendorDeletion,
  supplierLogin,
} from "../services/vendorsService";
import {
  setSupplierSession,
  hasValidSupplierSession,
  clearSupplierSession,
} from "../services/supplierSession";
import VendorForm from "./gifts/VendorForm";
import VendorPanel from "./gifts/VendorPanel";
import Logo from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import ConfirmDialog from "../components/ConfirmDialog";
import ProBadge from "../components/ProBadge";
import SupplierSideMenu from "../components/SupplierSideMenu";
import SupplierChecklist from "../components/SupplierChecklist";
import SupplierHome from "../components/SupplierHome";
import SupplierPayments from "../components/SupplierPayments";
import SupplierSocials from "../components/SupplierSocials";
import SupplierCookies from "../components/SupplierCookies";
import WhatsAppFab from "../components/WhatsAppFab";
import useUnsavedGuard from "../hooks/useUnsavedGuard";
import PullToRefresh from "../components/PullToRefresh";
import {
  getImportJob,
  subscribeImportJob,
  clearImportJob,
} from "../services/importJobs";
import { whatsappUrlWithText } from "../services/whatsapp";
import "../styles/gifts.css";
import "../styles/supplier-app.css";

/*
  SupplierEditPage — אזור הספק (פורטל ספקים), ציבורי ובמסך מלא. אפליקציה קטנה
  עם דפים: בית (סקירה), מוצרים, תשלומים, רשתות חברתיות, ותצוגה כמו שהוועד רואה.
  כל שמירה שולחת את הכרטיס המלא, כך שהכול מסונכרן לכרטיס שהוועדים רואים ב-VaddyGo.
  הטוקן שבכתובת הוא ההרשאה. תפריט ☰ עם הגדרות, וכפתור וואטסאפ צף לפנייה אלינו.
*/
const TABS = [
  { key: "home", label: "בית", icon: "🏠" },
  { key: "products", label: "מוצרים", icon: "📦" },
  { key: "payments", label: "תשלומים", icon: "💳" },
  { key: "socials", label: "רשתות", icon: "🔗" },
  { key: "preview", label: "תצוגה", icon: "👁" },
];

function SupplierEditPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const fetcher = useCallback(() => getVendorByToken(token), [token]);
  const { data: vendor, isLoading, error, reload } = useApi(fetcher);
  // הטאב הפעיל נשמר בכתובת (?tab=) ולא רק בזיכרון — כך רענון נשאר באותו עמוד,
  // וכפתור "חזור" חוזר לטאב הקודם במקום לזרוק החוצה למסך הכניסה/הרשמה.
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("tab") || "home";
  // שומר מפני עזיבת הטופס עם שינויים שלא נשמרו (מעבר טאב / התנתקות / חזור / רענון)
  const { confirmDiscard } = useUnsavedGuard();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  // הגדרת התחברות ראשונית — מייל+סיסמה כדי לחזור בלי הקישור
  const [credEmail, setCredEmail] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credMsg, setCredMsg] = useState(null);
  const [credSaving, setCredSaving] = useState(false);
  // תפריט הצד, בקשת מחיקה, שינוי סיסמה, והגדרות עוגיות
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deleteAsking, setDeleteAsking] = useState(false);
  const [deleteSent, setDeleteSent] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const [shareCatalogOpen, setShareCatalogOpen] = useState(false);
  const [catalogCopied, setCatalogCopied] = useState(false);
  // תיקייה מסוימת לשיתוף כקטלוג ("" = כל הקטלוג). נקבע כשלוחצים "קישור לקטלוג"
  // על תיקייה בדף הבית של הספק.
  const [shareCatalogFolder, setShareCatalogFolder] = useState("");
  // שינוי שם העסק (מתוך התפריט הצדדי)
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [bizName, setBizName] = useState("");
  const [nameMsg, setNameMsg] = useState(null);
  const [nameSaving, setNameSaving] = useState(false);
  // תיקייה + סטטוס שאליהם לפתוח את דף המוצרים (בלחיצה על תיקייה/אריח בדף הבית)
  const [productsFolder, setProductsFolder] = useState("");
  const [productsStatus, setProductsStatus] = useState("");
  // משימת ייבוא מוצרים (קובץ/צילום) שרצה ברקע — לבאנר גלובלי מעל כל הטאבים
  const [importJob, setImportJob] = useState(() => getImportJob());
  useEffect(() => subscribeImportJob(setImportJob), []);
  // שער כניסה: אם הספק כבר הגדיר מייל+סיסמה — דורשים התחברות (עם זיכרון קצר)
  const [sessionOk, setSessionOk] = useState(() =>
    hasValidSupplierSession(token)
  );
  const [gateEmail, setGateEmail] = useState("");
  const [gatePassword, setGatePassword] = useState("");
  const [gateError, setGateError] = useState("");
  const [gateLoading, setGateLoading] = useState(false);

  // בונה מטען כתיבה מלא מהכרטיס העדכני, עם דריסת השדות שהשתנו — כדי ששמירה של
  // חלק אחד (למשל תשלומים) לא תמחק חלק אחר (מוצרים/רשתות). זה מה שמסנכרן הכל.
  function fullVendorPayload(overrides = {}) {
    return {
      name: vendor?.name || "",
      catalogUrl: vendor?.catalogUrl || "",
      whatsApp: vendor?.whatsApp || "",
      category: vendor?.category || "",
      city: vendor?.city || "",
      paymentLink: vendor?.paymentLink || "",
      paymentBit: vendor?.paymentBit || "",
      paymentBankInfo: vendor?.paymentBankInfo || "",
      paymentInstallments: vendor?.paymentInstallments || 0,
      products: (vendor?.products || []).map((p) => ({
        name: p.name,
        description: p.description || "",
        price: p.price,
        imageUrl: p.imageUrl,
        folder: p.folder || "",
      })),
      socialLinks: (vendor?.socialLinks || []).map((l) => ({
        label: l.label || "",
        url: l.url,
      })),
      ...overrides,
    };
  }

  function goTo(nextView, folder, status) {
    // עוזבים טאב עם שינוי שלא נשמר? שואלים "לא לחצת שמור, האם להמשיך בכל זאת?"
    if (nextView !== view && !confirmDiscard()) return;
    setSaved(false);
    setSaveError("");
    if (nextView === "products") {
      setProductsFolder(folder || "");
      setProductsStatus(status || "");
    }
    // מעדכנים את הכתובת (?tab=) — push, כדי ש"חזור" יחזור לטאב הקודם.
    // "home" = בלי פרמטר (כתובת נקייה). דילוג אם כבר על אותו טאב (בלי כפילויות בהיסטוריה).
    if (nextView !== view) {
      setSearchParams(nextView === "home" ? {} : { tab: nextView });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleLogout() {
    if (!confirmDiscard()) return;
    clearSupplierSession();
    navigate("/supplier-login");
  }

  // שער הכניסה — מאמת מייל+סיסמה מול הכרטיס הזה ופותח סשן קצר
  async function handleGateLogin(event) {
    event.preventDefault();
    setGateError("");
    setGateLoading(true);
    try {
      const t = await supplierLogin({
        loginEmail: gateEmail.trim(),
        password: gatePassword,
      });
      if (t !== token) {
        setGateError(
          "הפרטים אינם תואמים לכרטיס הזה. אפשר להיכנס דרך 'כניסת ספקים'."
        );
        setGateLoading(false);
        return;
      }
      setSupplierSession(token);
      setSessionOk(true);
    } catch (err) {
      setGateError(err.message || "מייל או סיסמה שגויים");
      setGateLoading(false);
    }
  }

  // מוצרים ופרטי העסק (VendorForm) — משמרים את התשלומים והרשתות מהעדכני
  async function handleSaveProducts(payload) {
    setSaveError("");
    setSaved(false);
    try {
      await updateVendorByToken(token, {
        ...payload,
        paymentLink: vendor?.paymentLink || "",
        paymentBit: vendor?.paymentBit || "",
        paymentBankInfo: vendor?.paymentBankInfo || "",
        paymentInstallments: vendor?.paymentInstallments || 0,
        socialLinks: (vendor?.socialLinks || []).map((l) => ({
          label: l.label || "",
          url: l.url,
        })),
      });
      setSaved(true);
      reload();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSaveError(err.message || "לא הצלחנו לשמור. אפשר לנסות שוב בעוד רגע.");
    }
  }

  // תשלומים ורשתות — הרכיב מציג הודעת הצלחה/שגיאה משלו; כאן רק שומרים ומרעננים.
  async function handleSavePayments(fields) {
    await updateVendorByToken(token, fullVendorPayload(fields));
    reload();
  }
  async function handleSaveSocials(socialLinks) {
    await updateVendorByToken(token, fullVendorPayload({ socialLinks }));
    reload();
  }

  async function changePassword(event) {
    event.preventDefault();
    setPwMsg(null);
    if (newPw.length < 6) {
      setPwMsg({ ok: false, text: "הסיסמה חייבת להכיל לפחות 6 תווים" });
      return;
    }
    setPwSaving(true);
    try {
      await changeVendorPassword(token, newPw);
      setPwMsg({ ok: true, text: "הסיסמה עודכנה בהצלחה" });
      setNewPw("");
    } catch (err) {
      setPwMsg({ ok: false, text: err.message || "לא הצלחנו לעדכן את הסיסמה" });
    } finally {
      setPwSaving(false);
    }
  }

  // שינוי שם העסק — שומר את הכרטיס המלא עם השם החדש (כדי לא לדרוס שאר הפרטים).
  async function saveBizName(event) {
    event.preventDefault();
    setNameMsg(null);
    if (!bizName.trim()) {
      setNameMsg({ ok: false, text: "צריך למלא שם עסק" });
      return;
    }
    setNameSaving(true);
    try {
      await updateVendorByToken(token, fullVendorPayload({ name: bizName.trim() }));
      setNameMsg({ ok: true, text: "שם העסק עודכן" });
      reload();
    } catch (err) {
      setNameMsg({ ok: false, text: err.message || "לא הצלחנו לעדכן את השם" });
    } finally {
      setNameSaving(false);
    }
  }

  // בקשת מחיקת חשבון — נרשמת בשרת (+ מייל למנהלת) ונשלחת הודעת וואטסאפ לאישור.
  async function confirmDeleteRequest() {
    setDeleteAsking(false);
    try {
      await requestVendorDeletion(token);
    } catch {
      // גם אם הרישום נכשל — פותחים וואטסאפ כדי שהבקשה תגיע בכל זאת
    }
    const msg = `בקשת מחיקת חשבון ספק ב-VaddyGo: "${
      vendor?.name || ""
    }". אנא אשרו את המחיקה.`;
    window.open(
      whatsappUrlWithText("054-4579179", msg),
      "_blank",
      "noopener,noreferrer"
    );
    setDeleteSent(true);
  }

  async function saveCredentials(event) {
    event.preventDefault();
    setCredMsg(null);
    setCredSaving(true);
    try {
      await setVendorCredentials(token, {
        loginEmail: credEmail.trim(),
        password: credPassword,
      });
      setCredMsg({ ok: true, text: "מעכשיו אפשר להתחבר עם המייל והסיסמה האלה" });
      setCredPassword("");
      // הרגע הגדירו כניסה — פותחים סשן כדי שלא ינעלו אותם מיד אחרי השמירה
      setSupplierSession(token);
      setSessionOk(true);
      reload();
    } catch (err) {
      setCredMsg({
        ok: false,
        text: err.message || "לא הצלחנו לשמור את פרטי ההתחברות",
      });
    } finally {
      setCredSaving(false);
    }
  }

  if (isLoading) {
    return <Spinner text="טוען את כרטיס הספק..." />;
  }

  if (error) {
    return (
      <div className="supplier-edit">
        <ErrorMessage
          message="הקישור אינו תקין או שכבר אינו בתוקף. אפשר לבקש קישור חדש מהוועד."
          onRetry={reload}
        />
      </div>
    );
  }

  // שער כניסה — הספק כבר הגדיר מייל+סיסמה ואין סשן בתוקף: מבקשים התחברות
  if (vendor?.hasLogin && !sessionOk) {
    return (
      <div className="supplier-edit" dir="rtl">
        {/* משיכה למטה לרענון (נייד/מסך-בית) — אין רענון דפדפן במצב אפליקציה */}
        <PullToRefresh />
        <div className="supplier-edit__brand">
          <Logo />
        </div>
        <h1 className="supplier-edit__title">כניסת ספק</h1>
        <p className="supplier-edit__intro">
          שלום {vendor.name || "ספק יקר"} 👋 להמשך אל הכרטיס שלך, התחברו עם המייל
          והסיסמה שהגדרתם.
        </p>
        <form
          onSubmit={handleGateLogin}
          noValidate
          style={{ maxWidth: 380, margin: "0 auto" }}
        >
          <Input
            id="gate-email"
            label="מייל"
            type="email"
            autoComplete="username"
            value={gateEmail}
            onChange={(e) => setGateEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            id="gate-pw"
            label="סיסמה"
            type="password"
            autoComplete="current-password"
            value={gatePassword}
            onChange={(e) => setGatePassword(e.target.value)}
          />
          {gateError && <ErrorMessage message={gateError} />}
          <div className="gift-form__actions">
            <Button type="submit" isLoading={gateLoading}>
              כניסה
            </Button>
          </div>
          <p className="supplier-edit__login-link">
            שכחת סיסמה? <Link to="/supplier-forgot-password">איפוס במייל</Link>
          </p>
        </form>
      </div>
    );
  }

  // קישור לקטלוג הציבורי — לכל הקטלוג, או לתיקייה בודדת (?folder=<שם>)
  const buildCatalogUrl = (folder) =>
    `${window.location.origin}/catalog/${vendor?.id}` +
    (folder ? `?folder=${encodeURIComponent(folder)}` : "");

  // פותח את מודאל השיתוף — לכל הקטלוג (folder="") או לתיקייה מסוימת
  const openShareCatalog = (folder = "") => {
    setCatalogCopied(false);
    setShareCatalogFolder(folder);
    setShareCatalogOpen(true);
  };

  return (
    <div className="supplier-edit" dir="rtl">
      {/* משיכה למטה לרענון (נייד/מסך-בית) — אין רענון דפדפן במצב אפליקציה */}
      <PullToRefresh />
      <div className="sup-head">
        <button
          type="button"
          aria-label="תפריט"
          onClick={() => setIsMenuOpen(true)}
          style={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: 10,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            fontSize: 20,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ☰
        </button>
        <span className="sup-head__logo">
          <Logo />
        </span>
        <span className="sup-head__hi">שלום {vendor.name || "ספק יקר"} 👋</span>
      </div>

      {importJob && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            margin: "6px 0",
            borderRadius: 12,
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            background:
              importJob.status === "done"
                ? "#eafaf1"
                : importJob.status === "loading"
                ? "var(--color-primary-light)"
                : "#fdf1e7",
            border: `1px solid ${
              importJob.status === "done"
                ? "#b7e6cd"
                : importJob.status === "loading"
                ? "var(--color-primary)"
                : "#f0c9a3"
            }`,
            color:
              importJob.status === "done"
                ? "#1d8a55"
                : importJob.status === "loading"
                ? "var(--color-primary-dark)"
                : "#c05a17",
          }}
        >
          <span style={{ flex: 1 }}>{importJob.message}</span>
          {importJob.status === "done" && view !== "products" && (
            <button
              type="button"
              onClick={() => goTo("products")}
              style={{
                border: "none",
                background: "none",
                color: "var(--color-link)",
                fontFamily: "var(--font-family)",
                fontWeight: 700,
                fontSize: "var(--font-size-sm)",
                cursor: "pointer",
              }}
            >
              למוצרים »
            </button>
          )}
          {importJob.status !== "loading" && (
            <button
              type="button"
              aria-label="סגירה"
              onClick={clearImportJob}
              style={{
                border: "none",
                background: "none",
                color: "inherit",
                fontSize: 16,
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {saved && (
        <p className="sup-saved" role="status">
          ✔️ נשמר — כבר מעודכן אצל הוועדים
        </p>
      )}
      {saveError && (
        <p className="field__error" role="alert">
          {saveError}
        </p>
      )}
      {deleteSent && (
        <p className="supplier-edit__saved" role="status">
          ✓ בקשת המחיקה נשלחה ל-VaddyGo. ניצור קשר לאישור.
        </p>
      )}

      {/* פס ניווט בין הדפים — סגנון ניווט (אייקון + פס תחתון), דביק */}
      <nav className="sup-tabs" aria-label="ניווט אזור הספק">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => goTo(tab.key)}
            className={`sup-tab${view === tab.key ? " sup-tab--active" : ""}`}
          >
            <span className="sup-tab__icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {view === "home" && (
        <>
          <SupplierChecklist vendor={vendor} onGoTo={goTo} />
          {!vendor?.hasLogin && (
            <form
              className="supplier-edit__login"
              onSubmit={saveCredentials}
              noValidate
              style={{
                marginTop: 4,
                border: "1px solid var(--color-primary)",
                borderRadius: "var(--radius-md)",
                padding: 16,
                background: "var(--color-primary-light)",
              }}
            >
              <h2 className="supplier-edit__login-title">
                🔑 הגדרת כניסה קבועה — מייל וסיסמה
              </h2>
              <p className="supplier-edit__login-hint">
                קבעו מייל וסיסמה, וכך תוכלו לחזור ולעדכן בכל עת דרך עמוד כניסת
                הספקים — בלי הקישור.
              </p>
              <Input
                id="cred-email"
                label="מייל"
                type="email"
                value={credEmail}
                onChange={(e) => setCredEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Input
                id="cred-password"
                label="סיסמה (6 תווים לפחות)"
                type="password"
                value={credPassword}
                onChange={(e) => setCredPassword(e.target.value)}
              />
              {credMsg && (
                <p
                  className={
                    credMsg.ok ? "supplier-edit__saved" : "field__error"
                  }
                  role={credMsg.ok ? "status" : "alert"}
                >
                  {credMsg.ok ? "✓ " : ""}
                  {credMsg.text}
                </p>
              )}
              <Button type="submit" isLoading={credSaving}>
                שמירת פרטי כניסה
              </Button>
              <p className="supplier-edit__login-link">
                כבר הגדרתם? <Link to="/supplier-login">כניסת ספקים ←</Link>
              </p>
            </form>
          )}
          <div style={{ marginTop: 16 }}>
            <SupplierHome
              vendor={vendor}
              onGoTo={goTo}
              onShareCatalog={openShareCatalog}
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <Button variant="secondary" onClick={() => openShareCatalog("")}>
              🔗 שיתוף כל הקטלוג <ProBadge title="שיתוף קטלוג ממותג — פיצ'ר פרו" />
            </Button>
          </div>
        </>
      )}

      {view === "products" && (
        <>
          <p className="supplier-edit__intro" style={{ margin: "0 0 14px" }}>
            הוסיפו ועדכנו את המוצרים והפרטים — כל שינוי שתשמרו יופיע{" "}
            <strong>מיד</strong> לוועדים.
          </p>
          <VendorForm
            key={`products-${productsFolder}-${productsStatus}`}
            vendor={vendor}
            onSave={handleSaveProducts}
            hidePayments
            hideSocials
            hideBusinessDetails
            initialFolder={productsFolder}
            initialStatus={productsStatus}
            showFab
          />
        </>
      )}

      {view === "payments" && (
        <>
          <h2 className="sup-section-title">💳 אמצעי תשלום</h2>
          <SupplierPayments vendor={vendor} onSave={handleSavePayments} />
        </>
      )}

      {view === "socials" && (
        <>
          <h2 className="sup-section-title">
            🔗 רשתות חברתיות <ProBadge title="רשתות חברתיות — פיצ'ר פרו" />
          </h2>
          <SupplierSocials vendor={vendor} onSave={handleSaveSocials} />
        </>
      )}

      {view === "preview" && (
        <div className="supplier-edit__preview">
          <p className="supplier-edit__preview-hint">
            כך נראה הכרטיס שלך לוועדים באפליקציה. אפשר ללחוץ על תיקייה כדי לראות
            את המוצרים שבתוכה.
          </p>
          <VendorPanel vendor={vendor} readOnly />
        </div>
      )}

      {view === "settings" && (
        <>
          <h2 className="sup-section-title">⚙️ הגדרות משתמש</h2>
          <p className="supplier-edit__intro" style={{ margin: "0 0 14px" }}>
            פרטי העסק והמידע הנוסף שהוועדים רואים בכרטיס שלך. כל שינוי שתשמרו
            יופיע <strong>מיד</strong> לוועדים.
          </p>
          <VendorForm
            key="settings"
            vendor={vendor}
            onSave={handleSaveProducts}
            hideProducts
            hidePayments
            hideSocials
          />
        </>
      )}

      <SupplierSideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSettings={() => goTo("settings")}
        onChangeName={() => {
          setBizName(vendor?.name || "");
          setNameMsg(null);
          setNameModalOpen(true);
        }}
        onChangePassword={() => {
          setPwMsg(null);
          setNewPw("");
          setPwModalOpen(true);
        }}
        onCookies={() => setCookiesOpen(true)}
        onDeleteRequest={() => setDeleteAsking(true)}
        onLogout={handleLogout}
      />
      <WhatsAppFab />

      <Modal
        isOpen={pwModalOpen}
        onClose={() => setPwModalOpen(false)}
        title="חשבון וסיסמה 🔑"
      >
        <form onSubmit={changePassword} noValidate>
          <p className="supplier-edit__login-hint">
            כאן אפשר לעדכן את הסיסמה שלך לכניסה לפורטל הספקים.
          </p>
          <Input
            id="change-pw"
            label="סיסמה חדשה (6 תווים לפחות)"
            type="password"
            autoComplete="new-password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          {pwMsg && (
            <p
              className={pwMsg.ok ? "supplier-edit__saved" : "field__error"}
              role={pwMsg.ok ? "status" : "alert"}
            >
              {pwMsg.ok ? "✓ " : ""}
              {pwMsg.text}
            </p>
          )}
          <div className="gift-form__actions">
            <Button type="submit" isLoading={pwSaving}>
              עדכון סיסמה
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={nameModalOpen}
        onClose={() => setNameModalOpen(false)}
        title="שם העסק ✏️"
      >
        <form onSubmit={saveBizName} noValidate>
          <p className="supplier-edit__login-hint">
            זה השם שהוועדים רואים בכרטיס שלך. אפשר לעדכן אותו כאן בכל עת.
          </p>
          <Input
            id="biz-name"
            label="שם העסק"
            value={bizName}
            onChange={(e) => setBizName(e.target.value)}
            placeholder="למשל: מתוק שלי — עוגות בהזמנה"
          />
          {nameMsg && (
            <p
              className={nameMsg.ok ? "supplier-edit__saved" : "field__error"}
              role={nameMsg.ok ? "status" : "alert"}
            >
              {nameMsg.ok ? "✓ " : ""}
              {nameMsg.text}
            </p>
          )}
          <div className="gift-form__actions">
            <Button type="submit" isLoading={nameSaving}>
              שמירת השם
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={cookiesOpen}
        onClose={() => setCookiesOpen(false)}
        title="הגדרות עוגיות 🍪"
      >
        <SupplierCookies />
      </Modal>

      <Modal
        isOpen={shareCatalogOpen}
        onClose={() => setShareCatalogOpen(false)}
        title={
          shareCatalogFolder ? `שיתוף קטלוג: ${shareCatalogFolder} 🔗` : "שיתוף הקטלוג 🔗"
        }
      >
        <p className="supplier-edit__login-hint">
          {shareCatalogFolder
            ? `שלחו את הקישור הזה לכל אחד — הוא יראה קטלוג יפה של המוצרים בתיקייה "${shareCatalogFolder}", בלי אפשרות עריכה.`
            : "שלחו את הקישור הזה לכל אחד — הוא יראה קטלוג יפה של כל המוצרים שלכם, בלי אפשרות עריכה."}
        </p>
        <input
          className="field__input vendor-link__url"
          value={buildCatalogUrl(shareCatalogFolder)}
          readOnly
          onFocus={(e) => e.target.select()}
          aria-label="קישור הקטלוג"
        />
        <div className="vendor-link__actions">
          <Button
            onClick={() => {
              const url = buildCatalogUrl(shareCatalogFolder);
              if (navigator.clipboard) {
                navigator.clipboard
                  .writeText(url)
                  .then(() => setCatalogCopied(true));
              }
            }}
          >
            {catalogCopied ? "הועתק ✓" : "העתקת הקישור"}
          </Button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `${
                shareCatalogFolder
                  ? `הנה הקטלוג שלנו (${shareCatalogFolder}) ב-VaddyGo: `
                  : "הנה הקטלוג שלנו ב-VaddyGo: "
              }${buildCatalogUrl(shareCatalogFolder)}`
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary">שיתוף בוואטסאפ 💬</Button>
          </a>
          <a
            href={buildCatalogUrl(shareCatalogFolder)}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary">פתיחת הקטלוג</Button>
          </a>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteAsking}
        title="בקשת מחיקת חשבון"
        message="הבקשה תישלח לצוות VaddyGo בוואטסאפ לאישור. אחרי אישור — החשבון, הכרטיס והמוצרים יימחקו. להמשיך?"
        onConfirm={confirmDeleteRequest}
        onCancel={() => setDeleteAsking(false)}
      />
    </div>
  );
}

export default SupplierEditPage;
