import { useState } from "react";
import Card from "../../components/Card";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import { exportMyData } from "../../services/authService";

/*
  ExportDataCard — "זכות העיון": הורדת כל המידע השמור על המשתמשת ועל הגנים
  שלה, בקובץ אחד. משלים את מחיקת החשבון — עד היום אפשר היה למחוק הכול, אבל
  לא לראות מה בעצם נשמר.

  הקובץ נוצר בדפדפן מהתשובה של השרת ויורד ישירות למחשב; הוא אינו נשמר בשום
  מקום אצלנו ואינו נשלח באימייל.
*/
function ExportDataCard() {
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleExport() {
    setIsWorking(true);
    setError("");
    setDone(false);
    try {
      const data = await exportMyData();
      // יוצרים קובץ בדפדפן ומורידים אותו — בלי שרת ביניים
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vaddygo-my-data-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      setError(err.message || "לא הצלחנו להפיק את הקובץ. אפשר לנסות שוב.");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <Card
      title={
        <>
          <Icon name="package" size={20} /> הורדת המידע שלי
        </>
      }
    >
      <p className="settings__hint">
        הורדת קובץ עם <strong>כל</strong> המידע שנשמר עלייך ועל הגנים שלך —
        תלמידים, תשלומים, צוות, הוצאות, אירועים, מתנות וסקרים. הקובץ יורד
        ישירות למחשב שלך ואינו נשמר אצלנו.
      </p>
      <p className="settings__hint">
        מטעמי אבטחה הקובץ אינו כולל סיסמאות או קישורי גישה.
      </p>
      <Button onClick={handleExport} isLoading={isWorking}>
        הורדת קובץ המידע
      </Button>
      {done && (
        <p className="settings__hint" style={{ color: "var(--color-success)" }}>
          <Icon name="check" size={14} /> הקובץ ירד — אפשר לפתוח אותו מתיקיית
          ההורדות.
        </p>
      )}
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}

export default ExportDataCard;
