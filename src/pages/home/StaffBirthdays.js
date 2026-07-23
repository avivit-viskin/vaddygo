import { useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import Spinner from "../../components/Spinner";
import useApi from "../../hooks/useApi";
import { formatDayMonth, formatShekels } from "../../services/format";
import { getOnboarding } from "../../services/onboardingService";
import {
  getStaff,
  addStaffMember,
  updateStaffMember,
  deleteStaffMember,
  nextBirthday,
} from "../../services/staffService";
import StaffForm from "./StaffForm";

/*
  StaffBirthdays — צוות הגן וימי ההולדת הקרובים (UI_SPEC ס' 8):
  רשימה (שם · תפקיד · תאריך), הוספת איש צוות ועריכה בעיפרון.
  מעל הרשימה מוצגת המלצה כללית אחת: כמה מומלץ להשקיע על מתנות לצוות —
  חישוב פשוט וקבוע: 200 ₪ לכל איש צוות שהוגדר במספר אנשי הצוות של הגן.
  (3 אנשי צוות → מומלץ 600 ₪.)
*/
const GIFT_PER_STAFF = 200; // ₪ מומלצים למתנה לכל איש צוות

function StaffBirthdays({ onChanged, readOnly = false }) {
  const { data: staff, isLoading, error, reload } = useApi(getStaff);
  const [editing, setEditing] = useState(null); // null=סגור, {}=הוספה, member=עריכה
  const [deleting, setDeleting] = useState(null); // איש הצוות שממתין לאישור מחיקה
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // המלצה כללית: 200 ₪ לכל איש צוות, לפי מספר אנשי הצוות שהוגדר בהגדרות הגן
  const staffCount = Number(getOnboarding()?.staffCount) || 0;
  const totalGiftBudget = staffCount * GIFT_PER_STAFF;

  async function handleSave(values) {
    if (editing?.id) {
      await updateStaffMember(editing.id, values);
    } else {
      await addStaffMember(values);
    }
    setEditing(null);
    reload();
    onChanged?.();
  }

  async function confirmDelete() {
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteStaffMember(deleting.id);
      setDeleting(null);
      reload();
      onChanged?.();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  const sorted = (staff || [])
    .slice()
    .sort((a, b) => nextBirthday(a.birthDate) - nextBirthday(b.birthDate));

  return (
    <Card title="ימי הולדת של הצוות 🎂">
      {totalGiftBudget > 0 && (
        <p className="staff__budget-total">
          🎁 מומלץ להשקיע על מתנות לצוות: {formatShekels(totalGiftBudget)}
          <small className="staff__budget-note">
            {" "}({staffCount} אנשי צוות × {formatShekels(GIFT_PER_STAFF)})
          </small>
        </p>
      )}

      {isLoading && <Spinner />}
      {!isLoading && error && <p className="staff__error">{error}</p>}

      {!isLoading && !error && sorted.length === 0 && (
        <EmptyState icon="🎈" message="עדיין אין אנשי צוות — אפשר להוסיף את הראשון!" />
      )}

      {!isLoading && !error && sorted.length > 0 && (
        <ul className="staff">
          {sorted.map((member) => (
            <li key={member.id} className="staff__item">
              <div>
                <span className="staff__name">{member.fullName}</span>
                <span className="staff__role"> · {member.role}</span>
              </div>
              <div className="staff__side">
                <span className="staff__date">
                  {formatDayMonth(nextBirthday(member.birthDate))}
                </span>
                {/* "צופה" — לצפייה בלבד: בלי עריכה/מחיקה */}
                {!readOnly && (
                  <>
                    <button
                      type="button"
                      className="staff__edit"
                      aria-label={`עריכת ${member.fullName}`}
                      onClick={() => setEditing(member)}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="staff__delete"
                      aria-label={`מחיקת ${member.fullName}`}
                      onClick={() => setDeleting(member)}
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <Button variant="secondary" onClick={() => setEditing({})}>
          + הוספת איש צוות
        </Button>
      )}

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "עריכת איש צוות" : "הוספת איש צוות"}
      >
        {editing !== null && (
          <StaffForm
            member={editing?.id ? editing : null}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleting !== null}
        title="מחיקת איש צוות"
        message={
          deleting ? `למחוק את ${deleting.fullName}? אי אפשר לבטל` : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleting(null);
          setDeleteError("");
        }}
        isLoading={isDeleting}
        error={deleteError}
      />
    </Card>
  );
}

export default StaffBirthdays;
