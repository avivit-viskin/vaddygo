import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandName from "../../components/BrandName";
import Button from "../../components/Button";
import { saveOnboarding } from "../../services/onboardingService";
import { saveActiveOnboarding } from "../../services/institutionsService";
import GanDetailsStep from "./GanDetailsStep";
import GroupsStep from "./GroupsStep";
import CollectionStep from "./CollectionStep";
import SummaryStep from "./SummaryStep";
import "../../styles/onboarding.css";

/*
  OnboardingWizard — אשף ההרשמה וההגדרה הראשונית (UI_SPEC סעיפים 3-6).
  הזרימה: פרטי הגן → קבוצות → גבייה → סיכום.
  שאלת "כמה ועדים" הועברה למסך ניהול ההרשאות (TeamSetupPage) כדי לקצר את האשף.
  שלב הגבייה אינו חובה — אפשר לדלג ("אכניס את הפרטים מאוחר יותר").
*/

// קטגוריות הגבייה מהאפיון; הסכומים בפנקס הם דוגמאות ולכן משמשים כ-placeholder בלבד
const DEFAULT_CATEGORIES = [
  { key: "meals", name: "תשלום הזנה", amount: "", installments: 1, examplePlaceholder: "למשל: 1,200" },
  { key: "committee", name: "דמי ועד", amount: "", installments: 1, examplePlaceholder: "למשל: 500" },
  { key: "classes", name: "חוגים (אופציונלי)", amount: "", installments: 1, examplePlaceholder: "למשל: 400" },
  { key: "pencilcase", name: "קלמר אישי", amount: "", installments: 1, examplePlaceholder: "למשל: 125" },
];

function OnboardingWizard() {
  const navigate = useNavigate();
  const stepKeys = ["gan", "groups", "collection", "summary"];
  const totalSteps = stepKeys.length;

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState({
    city: "",
    ganName: "",
    childrenCount: "",
    staffCount: "",
    hasGroups: null,
    institutionType: "gan",
    groups: [],
    categories: DEFAULT_CATEGORIES,
  });

  const currentKey = stepKeys[step - 1];

  function handleChange(patch) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  // ולידציה של צעד פרטי הגן — שאר הצעדים אופציונליים לפי האפיון
  function validateDetails() {
    const next = {};
    if (!data.city.trim()) next.city = "צריך למלא עיר";
    if (!data.ganName.trim()) next.ganName = "צריך למלא את שם הגן";
    if (!data.childrenCount || Number(data.childrenCount) < 1)
      next.childrenCount = "צריך למלא מספר ילדים (לפחות 1)";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleNext() {
    if (currentKey === "gan" && !validateDetails()) return;
    setStep((s) => Math.min(s + 1, totalSteps));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleFinish() {
    setIsSaving(true);
    const result = await saveOnboarding(data); // גם אם השרת לא זמין — נשמר מקומית וממשיכים
    // רושם את המוסד ברשימת המוסדות (בהרשמת מוסד נוסף רק מפעיל את הנוכחי),
    // עם מזהה ה-Group מהשרת כדי לסנן את הנתונים לפי מוסד
    saveActiveOnboarding(data, result?.groupId ?? null);
    // אחרי הגדרת הגן — מסך ניהול המשתמשים וההרשאות (משימה 6), ואז לאפליקציה
    navigate("/team-setup");
  }

  function renderStep(key) {
    switch (key) {
      case "gan":
        return <GanDetailsStep data={data} errors={errors} onChange={handleChange} />;
      case "groups":
        return <GroupsStep data={data} onChange={handleChange} />;
      case "collection":
        return (
          <CollectionStep data={data} onChange={handleChange} onSkip={handleNext} />
        );
      case "summary":
        return <SummaryStep data={data} />;
      default:
        return null;
    }
  }

  return (
    <div className="wizard">
      <h1 className="wizard__logo">
        <BrandName withHeart />
      </h1>
      {step === 1 && (
        <p className="wizard__intro">מתחילים 🙂 כמה שאלות קצרות שנוכל להכיר</p>
      )}
      <p className="wizard__progress">
        שלב {step} מתוך {totalSteps}
      </p>

      {renderStep(currentKey)}

      <div className="wizard__actions">
        {step > 1 && (
          <Button variant="secondary" onClick={handleBack}>
            חזרה
          </Button>
        )}
        {step < totalSteps && <Button onClick={handleNext}>המשך</Button>}
        {step === totalSteps && (
          <Button onClick={handleFinish} isLoading={isSaving}>
            כניסה לאפליקציה
          </Button>
        )}
      </div>
    </div>
  );
}

export default OnboardingWizard;
