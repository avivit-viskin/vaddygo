import Card from "../../components/Card";
import Icon from "../../components/Icon";
import { formatShekels } from "../../services/format";

/*
  SubgroupBreakdown — פילוח הגבייה לפי קבוצות הגן (תינוקייה/פעוטות/בוגרים):
  לכל קבוצה כמה ילדים משויכים אליה, כמה צריך לגבות (סכום-לילד × מספר הילדים
  בקבוצה) וכמה כבר נגבה. מוצג רק כשהוגדרו קבוצות בגן ויש בהן ילדים.
*/
function SubgroupBreakdown({ subgroups }) {
  const rows = (subgroups || []).filter((s) => (Number(s.childrenCount) || 0) > 0);
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
              <div className="subgroups__head">
                <span className="subgroups__name">{sg.name}</span>
                <span className="subgroups__count">{sg.childrenCount} ילדים</span>
              </div>
              <span className="subgroups__amounts">
                נגבה {formatShekels(collected)} מתוך {formatShekels(target)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default SubgroupBreakdown;
