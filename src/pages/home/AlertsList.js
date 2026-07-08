import Card from "../../components/Card";

/*
  AlertsList — התראות מסך הבית (UI_SPEC ס' 8): תשלומים, ימי הולדת וכו'.
  לא מוצג כלום כשאין התראות — בלי רעש מיותר.
*/
const TYPE_ICONS = { payments: "💰", birthday: "🎂" };

function AlertsList({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <Card title="התראות">
      <ul className="alerts">
        {alerts.map((alert, index) => (
          <li key={index} className={`alerts__item alerts__item--${alert.type}`}>
            <span aria-hidden="true">{TYPE_ICONS[alert.type] || "🔔"}</span>
            <span>{alert.message}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default AlertsList;
