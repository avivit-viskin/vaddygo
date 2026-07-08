import Card from "../../components/Card";

/*
  SummaryStep — צעד 5 באשף: "הכל מוכן!" עם כרטיס סיכום ההגדרות (UI_SPEC סעיף 6).
  שליחת הזמנות לצוות תופיע כאן כשתיבנה תכונת ניהול הצוות — לא מציגים
  הודעה על הזמנות שלא באמת נשלחו.
*/
function SummaryStep({ data }) {
  const totalPerChild = data.categories.reduce(
    (sum, c) => sum + (Number(c.amount) || 0),
    0
  );
  const totalGoal = totalPerChild * (Number(data.childrenCount) || 0);

  return (
    <>
      <p className="wizard__question">
        🎉 הכל מוכן! {data.ganName} הוגדר בהצלחה.
      </p>
      <Card title="סיכום ההגדרות">
        <ul className="summary-list">
          <li>
            <span>שם הגן</span>
            <span className="summary-list__value">{data.ganName}</span>
          </li>
          <li>
            <span>עיר</span>
            <span className="summary-list__value">{data.city}</span>
          </li>
          <li>
            <span>מספר ילדים</span>
            <span className="summary-list__value">{data.childrenCount}</span>
          </li>
          <li>
            <span>קבוצות</span>
            <span className="summary-list__value">
              {data.hasGroups && data.groups.length > 0
                ? data.groups.join(", ")
                : "ללא חלוקה"}
            </span>
          </li>
          <li>
            <span>יעד גבייה</span>
            <span className="summary-list__value">
              {totalGoal.toLocaleString("he-IL")} ₪
            </span>
          </li>
          <li>
            <span>משתמשות</span>
            <span className="summary-list__value">
              את + {Number(data.staffCount) || 0}
            </span>
          </li>
        </ul>
      </Card>
    </>
  );
}

export default SummaryStep;
