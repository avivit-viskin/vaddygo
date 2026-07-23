import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import { getGifts, addGift, updateGift, deleteGift } from "../services/giftsService";
import {
  getVendors,
  addVendor,
  updateVendor,
} from "../services/vendorsService";
import { getHolidayBudgets } from "../services/holidayBudgetsService";
import { getExpenses } from "../services/expensesService";
import { syncGiftExpense, giftExpenseDescription } from "../services/giftExpense";
import { upcomingHolidays } from "../services/upcomingHoliday";
import { isActiveReadOnly } from "../services/institutionsService";
import CountdownBanner from "./gifts/CountdownBanner";
import UpcomingMonth from "./gifts/UpcomingMonth";
import PendingEventExpenses from "./gifts/PendingEventExpenses";
import BudgetRecommendation from "./gifts/BudgetRecommendation";
import GiftCard from "./gifts/GiftCard";
import GiftForm from "./gifts/GiftForm";
import VendorPanel from "./gifts/VendorPanel";
import VendorForm from "./gifts/VendorForm";
import "../styles/gifts.css";

/*
  GiftsPage — מסך מתנות וספקים (UI_SPEC ס' 12): ספירה לאחור לחג הקרוב,
  רשימת מתנות עם סטטוס ותקציב, עוזרת תקציבית (מנוצל מול תקציב החג),
  וספקים עם דף מוצרים וקטלוג. עובד גם בלי שרת (נתונים מקומיים).
*/
function GiftsPage() {
  // "צופה" — לצפייה בלבד: מסתירים הוספה/עריכה/מחיקה של מתנות וספקים
  const readOnly = isActiveReadOnly();
  const [gifts, setGifts] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingGift, setEditingGift] = useState(null); // null=סגור, {}=חדש, gift=עריכה
  const [deletingGift, setDeletingGift] = useState(null);
  const [openVendor, setOpenVendor] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);

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

  if (isLoading) {
    return <Spinner text="טוען מתנות וספקים..." />;
  }

  return (
    <div className="gifts">
      <CountdownBanner />
      <UpcomingMonth />
      {/* "צופה" — לצפייה בלבד: בלי תזכורת/רישום הוצאה על אירועים שעברו */}
      {!readOnly && <PendingEventExpenses onRecorded={load} />}

      <Card title="המתנות שרכשתי 🎁">
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

      <BudgetRecommendation holidayBudgets={budgets} spent={spentOnGifts} />

      <Card title="ספקים 🏷️">
        {vendors.length === 0 ? (
          <EmptyState icon="🛍️" message="עדיין אין ספקים — אפשר להוסיף ספק ראשון." />
        ) : (
          <ul className="vendors">
            {vendors.map((vendor) => (
              <li key={vendor.id}>
                <button
                  type="button"
                  className="vendors__item"
                  onClick={() => setOpenVendor(vendor)}
                >
                  {vendor.name}
                  {vendor.products?.length > 0 && (
                    <span className="vendors__count">
                      {vendor.products.length} מוצרים
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        {!readOnly && (
          <Button variant="secondary" onClick={() => setEditingVendor({})}>
            + הוספת ספק
          </Button>
        )}
      </Card>

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
        title={openVendor?.name}
      >
        {openVendor != null && (
          <VendorPanel
            vendor={openVendor}
            onEdit={() => setEditingVendor(openVendor)}
            readOnly={readOnly}
          />
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
    </div>
  );
}

export default GiftsPage;
