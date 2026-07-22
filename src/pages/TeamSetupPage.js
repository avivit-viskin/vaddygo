import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Input from "../components/Input";
import TeamManager from "../components/TeamManager";
import {
  getInstitutions,
  addInstitution,
} from "../services/institutionsService";
import "../styles/team.css";

/*
  TeamSetupPage — מסך ניהול המשתמשים וההרשאות (משימה 6), מוצג אחרי אשף
  הגדרת הגן. ניהול חברי הוועד עצמו (הוספה/עריכה/הסרה) נמצא ב-TeamManager,
  המשותף גם למסך ההגדרות. כאן נשארת ההקמה: שאלת "כמה ועדים" והכניסה לאפליקציה.
*/
function TeamSetupPage() {
  const navigate = useNavigate();

  // שאלת "כמה ועדים" (הועברה מהאשף) — רלוונטית רק בהקמה הראשונה, כשקיים רק
  // המוסד הראשי. בהוספת מוסד נוסף כבר לא שואלים שוב.
  const [isFirstSetup] = useState(() => getInstitutions().length <= 1);
  const [extraCount, setExtraCount] = useState(0);
  const [extraNames, setExtraNames] = useState([]);

  function setCount(count) {
    const names = [...extraNames];
    names.length = count;
    setExtraCount(count);
    setExtraNames(names);
  }

  // סיום ההקמה: יוצר את הוועדים הנוספים ששמותיהם הוזנו (מוסדות להפעלה מאוחר
  // יותר), ואז נכנס לאפליקציה. משמש גם ל"כניסה" וגם ל"אעשה זאת מאוחר יותר".
  function finish() {
    extraNames
      .filter((n) => n && n.trim())
      .forEach((n) => addInstitution(n));
    navigate("/");
  }

  return (
    <div className="team-page">
      <h1 className="team-page__logo">
        <BrandName withHeart />
      </h1>
      <h2 className="team-page__title">מי עוד מנהל איתך את הוועד? 👥</h2>
      <p className="team-page__subtitle">
        אפשר להזמין חברות ועד נוספות ולתת לכל אחת הרשאה מתאימה. תמיד אפשר להוסיף
        או לשנות גם אחר כך.
      </p>

      <TeamManager />

      {isFirstSetup && (
        <section className="team-committees">
          <h2 className="team-page__title">מנהלת עוד ועדים חוץ מזה? 🏫</h2>
          <p className="team-page__subtitle">
            אפשר לנהל כמה ועדים באותו חשבון. אפשר להוסיף אותם עכשיו — או מאוחר
            יותר מהתפריט.
          </p>
          <div className="chips">
            <button
              type="button"
              className={`chip${extraCount === 0 ? " chip--active" : ""}`}
              aria-pressed={extraCount === 0}
              onClick={() => setCount(0)}
            >
              לא, רק זה
            </button>
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                className={`chip${extraCount === n ? " chip--active" : ""}`}
                aria-pressed={extraCount === n}
                onClick={() => setCount(n)}
              >
                {n} נוספים
              </button>
            ))}
          </div>
          {Array.from({ length: extraCount }).map((_, i) => (
            <Input
              key={i}
              id={`extra-committee-${i}`}
              label={`שם הוועד הנוסף ${i + 1}`}
              placeholder="למשל: גן הרימון"
              value={extraNames[i] || ""}
              onChange={(e) => {
                const names = [...extraNames];
                names[i] = e.target.value;
                setExtraNames(names);
              }}
            />
          ))}
        </section>
      )}

      <div className="team-page__actions">
        <Button variant="secondary" onClick={finish}>
          כניסה לאפליקציה
        </Button>
        <Button variant="secondary" onClick={finish}>
          אעשה זאת מאוחר יותר
        </Button>
      </div>
    </div>
  );
}

export default TeamSetupPage;
