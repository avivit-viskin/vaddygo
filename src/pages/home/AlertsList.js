import Card from "../../components/Card";
import Icon from "../../components/Icon";

/*
  AlertsList — התראות מסך הבית (UI_SPEC ס' 8): תשלומים, ימי הולדת וכו'.
  לא מוצג כלום כשאין התראות — בלי רעש מיותר.
*/
const TYPE_ICONS = { payments: "wallet", birthday: "cake" };

function AlertsList({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <Card
      title={
        <>
          <Icon name="bell" size={18} /> התראות
        </>
      }
    >
      <ul className="alerts">
        {alerts.map((alert, index) => (
          <li key={index} className={`alerts__item alerts__item--${alert.type}`}>
            <span aria-hidden="true">
              <Icon name={TYPE_ICONS[alert.type] || "bell"} size={18} />
            </span>
            <span>{alert.message}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default AlertsList;
