import { useCallback, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import {
  getVendorByToken,
  updateVendorByToken,
  setVendorCredentials,
  changeVendorPassword,
  requestVendorDeletion,
} from "../services/vendorsService";
import VendorForm from "./gifts/VendorForm";
import VendorPanel from "./gifts/VendorPanel";
import Logo from "../components/Logo";
import Input from "../components/Input";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import ConfirmDialog from "../components/ConfirmDialog";
import SupplierSideMenu from "../components/SupplierSideMenu";
import SupplierChecklist from "../components/SupplierChecklist";
import SupplierHome from "../components/SupplierHome";
import SupplierPayments from "../components/SupplierPayments";
import SupplierSocials from "../components/SupplierSocials";
import SupplierCookies from "../components/SupplierCookies";
import WhatsAppFab from "../components/WhatsAppFab";
import { whatsappUrlWithText } from "../services/whatsapp";
import "../styles/gifts.css";

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
  const [view, setView] = useState("home");
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
  // תיקייה שאליה לפתוח את דף המוצרים (בלחיצה על תיקייה בדף הבית)
  const [productsFolder, setProductsFolder] = useState("");

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

  function goTo(nextView, folder) {
    setSaved(false);
    setSaveError("");
    if (nextView === "products") {
      setProductsFolder(folder || "");
    }
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleLogout() {
    navigate("/supplier-login");
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

  return (
    <div className="supplier-edit" dir="rtl">
      <button
        type="button"
        aria-label="תפריט"
        onClick={() => setIsMenuOpen(true)}
        style={{
          position: "fixed",
          top: 12,
          insetInlineStart: 12,
          zIndex: 60,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-text)",
          fontSize: 22,
          lineHeight: 1,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
        }}
      >
        ☰
      </button>
      <div className="supplier-edit__brand">
        <Logo />
      </div>
      <h1 className="supplier-edit__title">אזור הספק שלך</h1>
      <p className="supplier-edit__intro">שלום {vendor.name || "ספק יקר"} 👋</p>

      {saved && (
        <p className="supplier-edit__saved" role="status">
          ✓ נשמר — כבר מעודכן אצל הוועדים
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

      {/* פס ניווט בין הדפים */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          padding: "8px 0 14px",
        }}
      >
        {TABS.map((tab) => {
          const active = view === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => goTo(tab.key)}
              style={{
                flexShrink: 0,
                padding: "8px 14px",
                borderRadius: 999,
                border: active
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
                background: active
                  ? "var(--color-primary)"
                  : "var(--color-surface)",
                color: active
                  ? "var(--color-primary-dark)"
                  : "var(--color-text)",
                fontWeight: active ? 700 : 500,
                fontFamily: "var(--font-family)",
                fontSize: "var(--font-size-sm)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

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
            <SupplierHome vendor={vendor} onGoTo={goTo} />
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
            key={`products-${productsFolder}`}
            vendor={vendor}
            onSave={handleSaveProducts}
            hidePayments
            hideSocials
            initialFolder={productsFolder}
          />
        </>
      )}

      {view === "payments" && (
        <>
          <h2
            className="supplier-edit__title"
            style={{ margin: "0 0 6px", fontSize: "var(--font-size-lg)" }}
          >
            💳 אמצעי תשלום
          </h2>
          <SupplierPayments vendor={vendor} onSave={handleSavePayments} />
        </>
      )}

      {view === "socials" && (
        <>
          <h2
            className="supplier-edit__title"
            style={{ margin: "0 0 6px", fontSize: "var(--font-size-lg)" }}
          >
            🔗 רשתות חברתיות
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

      <SupplierSideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={goTo}
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
        isOpen={cookiesOpen}
        onClose={() => setCookiesOpen(false)}
        title="הגדרות עוגיות 🍪"
      >
        <SupplierCookies />
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
