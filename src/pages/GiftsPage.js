import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Icon from "../components/Icon";
import WhatsAppIcon from "../components/WhatsAppIcon";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import KosherBadge from "../components/KosherBadge";
import { getGifts, addGift, updateGift, deleteGift } from "../services/giftsService";
import {
  getVendors,
  addVendor,
  updateVendor,
  deleteVendor,
  generateVendorEditLink,
  dismissVendorDeletion,
} from "../services/vendorsService";
import { whatsappUrl, whatsappUrlWithText } from "../services/whatsapp";
import { getHolidayBudgets } from "../services/holidayBudgetsService";
import { getExpenses } from "../services/expensesService";
import { syncGiftExpense, giftExpenseDescription } from "../services/giftExpense";
import { upcomingHolidays } from "../services/upcomingHoliday";
import { isActiveReadOnly } from "../services/institutionsService";
import { isSuperAdmin } from "../services/authService";
import CountdownBanner from "./gifts/CountdownBanner";
import UpcomingMonth from "./gifts/UpcomingMonth";
import PendingEventExpenses from "./gifts/PendingEventExpenses";
import BudgetRecommendation from "./gifts/BudgetRecommendation";
import GiftCard from "./gifts/GiftCard";
import GiftForm from "./gifts/GiftForm";
import FilterChips from "../components/FilterChips";
import VendorPanel from "./gifts/VendorPanel";
import VendorForm from "./gifts/VendorForm";
import VendorReportModal from "./gifts/VendorReportModal";
import "../styles/gifts.css";

/*
  GiftsPage — מסך מתנות וספקים (UI_SPEC ס' 12): ספירה לאחור לחג הקרוב,
  רשימת מתנות עם סטטוס ותקציב, עוזרת תקציבית (מנוצל מול תקציב החג),
  וספקים עם דף מוצרים וקטלוג. עובד גם בלי שרת (נתונים מקומיים).
*/
function GiftsPage() {
  // "צופה" — לצפייה בלבד: מסתירים הוספה/עריכה/מחיקה של מתנות וספקים
  const readOnly = isActiveReadOnly();
  // ניהול ספקים (הוספה ועריכת פרטים) שמור לבעלת האפליקציה (SuperAdmin) בלבד —
  // לא לכל וועד. ספקים הם ערוץ מנוהל מרכזית; וועד רגיל רק צופה ומשלם.
  const canManageVendors = isSuperAdmin();
  const [gifts, setGifts] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingGift, setEditingGift] = useState(null); // null=סגור, {}=חדש, gift=עריכה
  const [deletingGift, setDeletingGift] = useState(null);
  const [openVendor, setOpenVendor] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);
  // קישור עריכה אישי שנוצר לספק (לשליחה אליו); null = אין מודאל פתוח
  const [editLink, setEditLink] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  // סינון הספקים לפי קטגוריה ולפי מיקום (גילוי); "" = הכל
  const [vendorFilter, setVendorFilter] = useState("");
  const [vendorCityFilter, setVendorCityFilter] = useState("");
  // ספק שממתין לאישור מחיקה (מודאל אישור); null = סגור
  const [approvingVendor, setApprovingVendor] = useState(null);
  // ספק שהמנהלת בחרה למחוק ישירות (מודאל אישור); null = סגור
  const [deletingVendor, setDeletingVendor] = useState(null);
  // ספק שהמנהלת פתחה את הדוח שלו (התקדמות + סטטיסטיקות); null = סגור
  const [reportVendor, setReportVendor] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [giftsData, vendorsData, budgetsData, expensesData] = await Promise.all([
      getGifts(),
      getVendors(),
      getHolidayBudgets(),
      getExpenses().catch(() => []),
    ]);
    setGifts(giftsData);
    setVendors(vendorsData);
    setBudgets(budgetsData);
    setExpenses(expensesData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const holidays = useMemo(() => upcomingHolidays(), []);
  const vendorsById = useMemo(
    () => new Map(vendors.map((vendor) => [vendor.id, vendor])),
    [vendors]
  );
  // הקטגוריות והמיקומים שקיימים בפועל אצל הספקים — לכפתורי הסינון (גילוי).
  // מציגים רק ערכים שקיימים בפועל, כדי שלא ייווצר סינון שמחזיר רשימה ריקה.
  const vendorCategories = useMemo(
    () => [...new Set(vendors.map((v) => v.category).filter(Boolean))],
    [vendors]
  );
  const vendorCities = useMemo(
    () => [...new Set(vendors.map((v) => v.city).filter(Boolean))],
    [vendors]
  );
  // שני הסינונים פועלים יחד (קטגוריה וגם מיקום)
  const visibleVendors = vendors.filter(
    (v) =>
      (!vendorFilter || v.category === vendorFilter) &&
      (!vendorCityFilter || v.city === vendorCityFilter)
  );
  // סך ששולם לכל ספק (הוצאות המקושרות אליו) — למעקב "תשלומים לספקים"
  const vendorPaidById = useMemo(() => {
    const map = {};
    for (const e of expenses) {
      if (e.vendorId != null) {
        map[e.vendorId] = (map[e.vendorId] || 0) + (Number(e.amount) || 0);
      }
    }
    return map;
  }, [expenses]);

  // סך המתנות שכבר בוצעו — כמה כבר הוצא בפועל (לעוזרת התקציב)
  const spentOnGifts = useMemo(
    () =>
      (gifts || [])
        .filter((gift) => gift.status === "done")
        .reduce((sum, gift) => sum + (Number(gift.totalAmount) || 0), 0),
    [gifts]
  );

  // אמצעי התשלום של מתנה שנערכת — מההוצאה המשויכת (אם כבר בוצעה), אחרת מזומן
  const editingGiftMethod = useMemo(() => {
    if (!editingGift?.id) return "cash";
    const description = giftExpenseDescription(editingGift.name);
    return (
      expenses.find((expense) => expense.description === description)?.method ||
      editingGift.method ||
      "cash"
    );
  }, [editingGift, expenses]);

  async function handleSaveGift(values) {
    const prev = editingGift?.id ? editingGift : null;
    if (prev) {
      await updateGift(prev.id, values);
    } else {
      await addGift(values);
    }
    // הסנכרון מבוסס על מה שהוקלד בטופס (values) ולא על מה שהשרת החזיר, כדי
    // שהסטטוס/הסכום שנבחרו יחייבו את ההוצאה. "בוצע" → רושם הוצאה שמקטינה את
    // היתרה ואת האמצעי; כל סטטוס אחר → מוחק אותה.
    await syncGiftExpense({
      prevName: prev?.name,
      gift: values,
      method: values.method,
    });
    setEditingGift(null);
    load();
  }

  async function handleDeleteGift() {
    // מתנה שבוצעה — מסירים גם את ההוצאה המשויכת מהקופה
    await syncGiftExpense({
      prevName: deletingGift.name,
      gift: { ...deletingGift, status: "deleted" },
      method: deletingGift.method,
    });
    await deleteGift(deletingGift.id);
    setDeletingGift(null);
    load();
  }

  async function handleSaveVendor(values) {
    const saved = editingVendor?.id
      ? await updateVendor(editingVendor.id, values)
      : await addVendor(values);
    setEditingVendor(null);
    // אם ערכנו ספק שפתוח בדף — לרענן את התצוגה שלו
    if (openVendor && saved && openVendor.id === saved.id) {
      setOpenVendor(saved);
    }
    load();
  }

  // יוצר (או מחזיר) קישור עריכה אישי לספק, לשליחה אליו — הוא יעדכן את הכרטיס
  // שלו בעצמו, וזה יופיע כאן אוטומטית. שמור לבעלת האפליקציה (SuperAdmin).
  async function handleShareEditLink(vendor) {
    if (!vendor?.id) {
      return;
    }
    const token = await generateVendorEditLink(vendor.id);
    setLinkCopied(false);
    setEditLink({
      url: `${window.location.origin}/supplier/${token}`,
      vendorName: vendor.name,
      whatsApp: vendor.whatsApp,
    });
  }

  function copyEditLink() {
    if (editLink?.url && navigator.clipboard) {
      navigator.clipboard.writeText(editLink.url).then(() => setLinkCopied(true));
    }
  }

  // אישור מחיקת ספק שביקש להימחק — מוחק לצמיתות (SuperAdmin), דרך ConfirmDialog.
  async function handleApproveDelete() {
    if (!approvingVendor?.id) {
      return;
    }
    await deleteVendor(approvingVendor.id);
    setApprovingVendor(null);
    setOpenVendor(null);
    load();
  }

  // דחיית בקשת מחיקה — משאירים את הספק ומנקים את הדגל.
  async function handleDismissDelete(vendor) {
    if (!vendor?.id) {
      return;
    }
    await dismissVendorDeletion(vendor.id);
    if (openVendor && openVendor.id === vendor.id) {
      setOpenVendor({ ...vendor, deletionRequested: false });
    }
    load();
  }

  // מחיקת ספק ביוזמת המנהלת (SuperAdmin) — לצמיתות, דרך ConfirmDialog.
  async function handleDeleteVendor() {
    if (!deletingVendor?.id) {
      return;
    }
    await deleteVendor(deletingVendor.id);
    if (openVendor && openVendor.id === deletingVendor.id) {
      setOpenVendor(null);
    }
    setDeletingVendor(null);
    load();
  }

  if (isLoading) {
    return <Spinner text="טוען מתנות וספקים..." />;
  }

  return (
    <div className="gifts">
      <CountdownBanner />
      <UpcomingMonth />
      {/* "צופה" — לצפייה בלבד: בלי תזכורת/רישום הוצאה על אירועים שעברו */}
      {!readOnly && <PendingEventExpenses onRecorded={load} />}

      <Card
        title={
          <>
            <Icon name="gift" size={20} /> המתנות שרכשתי
          </>
        }
      >
        {gifts.length === 0 ? (
          <EmptyState icon="🎁" message="עדיין אין מתנות — נוסיף את הראשונה?" />
        ) : (
          <div className="gifts__list">
            {gifts.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                vendorName={vendorsById.get(gift.vendorId)?.name}
                onEdit={() => setEditingGift(gift)}
                onDelete={() => setDeletingGift(gift)}
                onOpenVendor={() => setOpenVendor(vendorsById.get(gift.vendorId))}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
        {!readOnly && (
          <Button variant="secondary" onClick={() => setEditingGift({})}>
            + הוספת מתנה
          </Button>
        )}
      </Card>

      <Card
        title={
          // צבע שחור-פחם מפורש (inline) — כדי שהכותרת תישאר שחורה בוודאות, בלי
          // תלות בקובץ העיצוב של אזור הספקים (שנמצא כרגע בעריכה של תהליך אחר).
          <span style={{ color: "var(--color-primary-dark)" }}>
            <Icon name="tag" size={20} /> ספקים
          </span>
        }
      >
        {vendors.length === 0 ? (
          <EmptyState icon="🛍️" message="עדיין אין ספקים — אפשר להוסיף ספק ראשון." />
        ) : (
          <>
            <FilterChips
              label="קטגוריה"
              options={vendorCategories}
              value={vendorFilter}
              onChange={setVendorFilter}
            />
            <FilterChips
              label="מיקום"
              options={vendorCities}
              value={vendorCityFilter}
              onChange={setVendorCityFilter}
            />
            {visibleVendors.length === 0 && (
              <EmptyState
                icon="🔎"
                message="אין ספקים שמתאימים לסינון — אפשר ללחוץ על 'הכל'."
              />
            )}
            <ul className="vendors">
              {visibleVendors.map((vendor) => (
                <li
                  key={vendor.id}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <button
                    type="button"
                    className="vendors__item"
                    style={{ flex: 1, minWidth: 0 }}
                    onClick={() => setOpenVendor(vendor)}
                  >
                    <span className="vendors__info">
                      <span className="vendors__name">
                        {vendor.name}
                        {vendor.isKosher && <> <KosherBadge /></>}
                      </span>
                      {vendor.category && (
                        <span className="vendors__cat">
                          {vendor.category}
                          {vendor.city ? ` · ${vendor.city}` : ""}
                        </span>
                      )}
                    </span>
                    {vendor.products?.length > 0 && (
                      <span className="vendors__count">
                        {vendor.products.length} מוצרים
                      </span>
                    )}
                  </button>
                  {canManageVendors && vendor.deletionRequested && (
                    <span
                      title="הספק ביקש למחוק את החשבון"
                      style={{
                        flexShrink: 0,
                        fontSize: "var(--font-size-sm)",
                        color: "#c0392b",
                        fontWeight: 700,
                      }}
                    >
                      🗑️ ביקש מחיקה
                    </span>
                  )}
                  {/* כפתור וואטסאפ ירוק ליד שם הספק — פותח שיחה עם הספק והודעה
                      מוכנה כבר מוקלדת (נשאר רק ללחוץ "שליחה") */}
                  {vendor.whatsApp && (
                    <a
                      href={whatsappUrlWithText(
                        vendor.whatsApp,
                        `היי ${vendor.name}! 🙂 הגענו אליכם דרך VaddyGo — אפליקציה לניהול ועדי הורים. נשמח לקבל פרטים ומחירים על המוצרים שלכם 🙏`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`וואטסאפ ל${vendor.name}`}
                      style={{
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "#eafaf0",
                        border: "1px solid #bfe6cf",
                        textDecoration: "none",
                      }}
                    >
                      <WhatsAppIcon size={24} />
                    </a>
                  )}
                  {/* דוח הספק — למנהלת בלבד: התקדמות הכרטיס, צפיות ופניות,
                      ואפשרות לשתף את הדוח עם הספק. */}
                  {canManageVendors && (
                    <button
                      type="button"
                      onClick={() => setReportVendor(vendor)}
                      aria-label={`דוח של ${vendor.name}`}
                      title="דוח הספק"
                      style={{
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "var(--color-primary-light)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-primary-dark)",
                        cursor: "pointer",
                      }}
                    >
                      <Icon name="chart" size={20} />
                    </button>
                  )}
                  {/* מחיקת ספק — למנהלת בלבד, עם אישור. אדום עדין כדי לא לבלוט מדי. */}
                  {canManageVendors && (
                    <button
                      type="button"
                      onClick={() => setDeletingVendor(vendor)}
                      aria-label={`מחיקת ${vendor.name}`}
                      title="מחיקת ספק"
                      style={{
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "#fdecea",
                        border: "1px solid #f5b7b1",
                        color: "#c0392b",
                        cursor: "pointer",
                      }}
                    >
                      <Icon name="trash" size={20} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
        {canManageVendors && (
          <Button variant="secondary" onClick={() => setEditingVendor({})}>
            + הוספת ספק
          </Button>
        )}
      </Card>

      <BudgetRecommendation holidayBudgets={budgets} spent={spentOnGifts} />

      {/* דוח ספק למנהלת — התקדמות הכרטיס + צפיות/פניות + שיתוף עם הספק */}
      <VendorReportModal
        vendor={reportVendor}
        onClose={() => setReportVendor(null)}
      />

      {/* טופס מתנה */}
      <Modal
        isOpen={editingGift !== null}
        onClose={() => setEditingGift(null)}
        title={editingGift?.id ? "עריכת מתנה" : "הוספת מתנה"}
      >
        {editingGift !== null && (
          <GiftForm
            gift={editingGift?.id ? editingGift : null}
            holidays={holidays}
            vendors={vendors}
            defaultMethod={editingGiftMethod}
            onSave={handleSaveGift}
            onCancel={() => setEditingGift(null)}
          />
        )}
      </Modal>

      {/* דף ספק */}
      <Modal
        isOpen={openVendor != null && editingVendor === null}
        onClose={() => setOpenVendor(null)}
        title={
          <>
            {openVendor?.name}
            {openVendor?.isKosher && <> <KosherBadge /></>}
          </>
        }
      >
        {openVendor != null && (
          <VendorPanel
            vendor={openVendor}
            onEdit={
              canManageVendors ? () => setEditingVendor(openVendor) : undefined
            }
            onShareEditLink={
              canManageVendors ? () => handleShareEditLink(openVendor) : undefined
            }
            onApproveDelete={
              canManageVendors && openVendor.deletionRequested
                ? () => setApprovingVendor(openVendor)
                : undefined
            }
            onDismissDelete={
              canManageVendors && openVendor.deletionRequested
                ? () => handleDismissDelete(openVendor)
                : undefined
            }
            paidTotal={vendorPaidById[openVendor.id] || 0}
            readOnly={readOnly}
          />
        )}
      </Modal>

      {/* קישור עריכה אישי לספק — לשליחה אליו כדי שיעדכן את הכרטיס שלו */}
      <Modal
        isOpen={editLink !== null}
        onClose={() => setEditLink(null)}
        title="קישור עריכה לספק"
      >
        {editLink && (
          <div className="vendor-link">
            <p>
              שלחו ל<strong>{editLink.vendorName}</strong> את הקישור הזה. הספק
              יעדכן בעצמו את הפרטים והמוצרים שלו — וזה יופיע כאן אוטומטית.
            </p>
            <input
              className="field__input vendor-link__url"
              value={editLink.url}
              readOnly
              onFocus={(e) => e.target.select()}
              aria-label="קישור העריכה לספק"
            />
            <div className="vendor-link__actions">
              <Button onClick={copyEditLink}>
                {linkCopied ? "הועתק ✓" : "העתקת הקישור"}
              </Button>
              {editLink.whatsApp && (
                <a
                  href={`${whatsappUrl(editLink.whatsApp)}?text=${encodeURIComponent(
                    `שלום 🙂 אפשר לעדכן כאן את הכרטיס והמוצרים שלך שמוצגים לוועדי ההורים ב-VaddyGo: ${editLink.url}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="secondary">
                    <Icon name="message" size={16} /> שליחה בוואטסאפ
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* טופס ספק */}
      <Modal
        isOpen={editingVendor !== null}
        onClose={() => setEditingVendor(null)}
        title={editingVendor?.id ? "עריכת ספק" : "הוספת ספק"}
      >
        {editingVendor !== null && (
          <VendorForm
            vendor={editingVendor?.id ? editingVendor : null}
            onSave={handleSaveVendor}
            onCancel={() => setEditingVendor(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deletingGift !== null}
        title="מחיקת מתנה"
        message={
          deletingGift ? `למחוק את "${deletingGift.name}"? אי אפשר לבטל.` : ""
        }
        onConfirm={handleDeleteGift}
        onCancel={() => setDeletingGift(null)}
      />

      <ConfirmDialog
        isOpen={approvingVendor !== null}
        title="אישור מחיקת ספק"
        message={
          approvingVendor
            ? `הספק "${approvingVendor.name}" ביקש למחוק את החשבון. למחוק אותו ואת כל המוצרים לצמיתות? אי אפשר לבטל.`
            : ""
        }
        onConfirm={handleApproveDelete}
        onCancel={() => setApprovingVendor(null)}
      />

      <ConfirmDialog
        isOpen={deletingVendor !== null}
        title="מחיקת ספק"
        message={
          deletingVendor
            ? `למחוק את הספק "${deletingVendor.name}" ואת כל המוצרים שלו לצמיתות? אי אפשר לבטל.`
            : ""
        }
        onConfirm={handleDeleteVendor}
        onCancel={() => setDeletingVendor(null)}
      />
    </div>
  );
}

export default GiftsPage;
