import { useState } from "react";
import Card from "../../components/Card";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import { formatShekels } from "../../services/format";

/*
  SubgroupBreakdown — פילוח הגבייה לפי קבוצות הגן (תינוקייה/פעוטות/צהרון...):
  לכל קבוצה כמה ילדים משויכים אליה, כמה צריך לגבות (הסכום-לילד של הקבוצה ×
  מספר הילדים) וכמה כבר נגבה. לחיצה על קבוצה פותחת חלון עם ה"מצב הכספי" שלה
  (כמו דף הבית): יעד, נגבה, חוב פתוח והתקדמות. מוצג רק כשיש קבוצות עם ילדים.
*/
function SubgroupBreakdown({ subgroups }) {
  const rows = (subgroups || []).filter((s) => (Number(s.childrenCount) || 0) > 0);
  const [selected, setSelected] = useState(null);

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card
      title={
        <>
          <Icon name="users" size={18} /> גבייה לפי קבוצות
        </>
      }
    >
      <ul className="subgroups">
        {rows.map((sg) => {
          const target = Number(sg.targetAmount) || 0;
          const collected = Number(sg.collectedAmount) || 0;
          return (
            <li key={sg.name} className="subgroups__item">
              <button
                type="button"
                className="subgroups__row"
                onClick={() => setSelected(sg)}
                aria-label={`פרטי הקבוצה ${sg.name}`}
              >
                <div className="subgroups__head">
                  <span className="subgroups__name">{sg.name}</span>
                  <span className="subgroups__count">{sg.childrenCount} ילדים</span>
                </div>
                <span className="subgroups__amounts">
                  נגבה {formatShekels(collected)} מתוך {formatShekels(target)}
                </span>
                <span className="subgroups__more" aria-hidden="true">
                  לחצו לפרטים ‹
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <SubgroupDetailModal
        subgroup={selected}
        onClose={() => setSelected(null)}
      />
    </Card>
  );
}

/* חלון פרטי קבוצה — המצב הכספי שלה כמו דף הבית (יעד/נגבה/חוב פתוח/התקדמות). */
function SubgroupDetailModal({ subgroup, onClose }) {
  if (!subgroup) {
    return null;
  }
  const target = Number(subgroup.targetAmount) || 0;
  const collected = Number(subgroup.collectedAmount) || 0;
  const openDebt = Math.max(0, target - collected);
  const percent = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;

  return (
    <Modal isOpen onClose={onClose} title={`קבוצה: ${subgroup.name}`}>
      <p className="subgroup-detail__count">{subgroup.childrenCount} ילדים בקבוצה</p>
      <div className="subgroup-detail__grid">
        <div className="subgroup-detail__stat">
          <span className="subgroup-detail__label">יעד גבייה</span>
          <span className="subgroup-detail__value">{formatShekels(target)}</span>
        </div>
        <div className="subgroup-detail__stat">
          <span className="subgroup-detail__label">נגבה עד כה</span>
          <span className="subgroup-detail__value subgroup-detail__value--good">
            {formatShekels(collected)}
          </span>
        </div>
        <div className="subgroup-detail__stat">
          <span className="subgroup-detail__label">חוב פתוח</span>
          <span className="subgroup-detail__value subgroup-detail__value--debt">
            {formatShekels(openDebt)}
          </span>
        </div>
      </div>
      <div className="subgroup-detail__progress">
        <div className="subgroup-detail__bar">
          <div
            className="subgroup-detail__fill"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="subgroup-detail__percent">{percent}% נגבו</span>
      </div>
    </Modal>
  );
}

export default SubgroupBreakdown;
