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
import { upcomingHolidays } from "../services/upcomingHoliday";
import CountdownBanner from "./gifts/CountdownBanner";
import UpcomingMonth from "./gifts/UpcomingMonth";
import GiftCard from "./gifts/GiftCard";
import GiftForm from "./gifts/GiftForm";
import BudgetAssistant from "./gifts/BudgetAssistant";
import VendorPanel from "./gifts/VendorPanel";
import VendorForm from "./gifts/VendorForm";
import "../styles/gifts.css";

/*
  GiftsPage — מסך מתנות וספקים (UI_SPEC ס' 12): ספירה לאחור לחג הקרוב,
  רשימת מתנות עם סטטוס ותקציב, עוזרת תקציבית (מנוצל מול תקציב החג),
  וספקים עם דף מוצרים וקטלוג. עובד גם בלי שרת (נתונים מקומיים).
*/
function GiftsPage() {
  const [gifts, setGifts] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingGift, setEditingGift] = useState(null); // null=סגור, {}=חדש, gift=עריכה
  const [deletingGift, setDeletingGift] = useState(null);
  const [openVendor, setOpenVendor] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [giftsData, vendorsData, budgetsData] = await Promise.all([
      getGifts(),
      getVendors(),
      getHolidayBudgets(),
    ]);
    setGifts(giftsData);
    setVendors(vendorsData);
    setBudgets(budgetsData);
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

  async function handleSaveGift(values) {
    if (editingGift?.id) {
      await updateGift(editingGift.id, values);
    } else {
      await addGift(values);
    }
    setEditingGift(null);
    load();
  }

  async function handleDeleteGift() {
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

      <Card title="מתנות">
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
              />
            ))}
          </div>
        )}
        <Button variant="secondary" onClick={() => setEditingGift({})}>
          + הוספת מתנה
        </Button>
      </Card>

      <BudgetAssistant gifts={gifts} holidayBudgets={budgets} />

      <Card title="ספקים 🏷️">
        {vendors.length === 0 ? (
          <EmptyState icon="🛍️" message="עדיין אין ספקים — הוסיפי ספק ראשון." />
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
        <Button variant="secondary" onClick={() => setEditingVendor({})}>
          + הוספת ספק
        </Button>
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
