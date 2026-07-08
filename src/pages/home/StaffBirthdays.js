import { useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import Spinner from "../../components/Spinner";
import useApi from "../../hooks/useApi";
import { formatDayMonth } from "../../services/format";
import {
  getStaff,
  addStaffMember,
  updateStaffMember,
  nextBirthday,
} from "../../services/staffService";
import StaffForm from "./StaffForm";

/*
  StaffBirthdays — צוות הגן וימי ההולדת הקרובים (UI_SPEC ס' 8):
  רשימה (שם · תפקיד · תאריך), הוספת איש צוות ועריכה בעיפרון.
  הרשימה ממוינת לפי יום ההולדת הקרוב.
*/
function StaffBirthdays({ onChanged }) {
  const { data: staff, isLoading, error, reload } = useApi(getStaff);
  const [editing, setEditing] = useState(null); // null=סגור, {}=הוספה, member=עריכה

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

  const sorted = (staff || [])
    .slice()
    .sort((a, b) => nextBirthday(a.birthDate) - nextBirthday(b.birthDate));

  return (
    <Card title="ימי הולדת של הצוות 🎂">
      {isLoading && <Spinner />}
      {!isLoading && error && <p className="staff__error">{error}</p>}

      {!isLoading && !error && sorted.length === 0 && (
        <EmptyState icon="🎈" message="עדיין אין אנשי צוות — הוסיפי את הראשונה!" />
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
                <button
                  type="button"
                  className="staff__edit"
                  aria-label={`עריכת ${member.fullName}`}
                  onClick={() => setEditing(member)}
                >
                  ✏️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" onClick={() => setEditing({})}>
        + הוספת איש צוות
      </Button>

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
    </Card>
  );
}

export default StaffBirthdays;
