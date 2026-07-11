import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandName from "../../components/BrandName";
import Button from "../../components/Button";
import { saveOnboarding } from "../../services/onboardingService";
import { saveActiveOnboarding } from "../../services/institutionsService";
import GanDetailsStep from "./GanDetailsStep";
import GroupsStep from "./GroupsStep";
import CommitteesStep from "./CommitteesStep";
import CollectionStep from "./CollectionStep";
import SummaryStep from "./SummaryStep";
import "../../styles/onboarding.css";

/*
  OnboardingWizard — אשף ההרשמה וההגדרה הראשונית (UI_SPEC סעיפים 3-6).
  חמישה צעדים: פרטי הגן → קבוצות → ועדים נוספים → הגדרת גבייה → סיכום.
  הנתונים נשמרים דרך onboardingService (מקומית עד שיהיה Group API).
*/

// קטגוריות הגבייה מהאפיון; הסכומים בפנקס הם דוגמאות ולכן משמשים כ-placeholder בלבד
const DEFAULT_CATEGORIES = [
  { key: "meals", name: "תשלום הזנה", amount: "", installments: 1, examplePlaceholder: "למשל: 1,200" },
  { key: "committee", name: "דמי ועד", amount: "", installments: 1, examplePlaceholder: "למשל: 500" },
  { key: "classes", name: "חוגים (אופציונלי)", amount: "", installments: 1, examplePlaceholder: "למשל: 400" },
  { key: "pencilcase", name: "קלמר אישי", amount: "", installments: 1, examplePlaceholder: "למשל: 125" },
];

const TOTAL_STEPS = 5;

function OnboardingWizard() {
  const navigate = useNavigate();
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
    extraCommittees: 0,
    extraCommitteeNames: [],
    categories: DEFAULT_CATEGORIES,
  });

  function handleChange(patch) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  // ולידציה של צעד 1 — שאר הצעדים אופציונליים לפי האפיון
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
    if (step === 1 && !validateDetails()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleFinish() {
    setIsSaving(true);
    const result = await saveOnboarding(data); // גם אם השרת לא זמין — נשמר מקומית וממשיכים
    // רושם את המוסד ברשימת המוסדות (ראשי + נוספים מהשמות שהוזנו),
    // עם מזהה ה-Group מהשרת כדי לסנן את הנתונים לפי מוסד
    saveActiveOnboarding(data, result?.groupId ?? null);
    navigate("/");
  }

  return (
    <div className="wizard">
      <h1 className="wizard__logo">
        <BrandName withHeart />
      </h1>
      <p className="wizard__progress">
        שלב {step} מתוך {TOTAL_STEPS}
      </p>

      {step === 1 && (
        <GanDetailsStep data={data} errors={errors} onChange={handleChange} />
      )}
      {step === 2 && <GroupsStep data={data} onChange={handleChange} />}
      {step === 3 && <CommitteesStep data={data} onChange={handleChange} />}
      {step === 4 && <CollectionStep data={data} onChange={handleChange} />}
      {step === 5 && <SummaryStep data={data} />}

      <div className="wizard__actions">
        {step > 1 && (
          <Button variant="secondary" onClick={handleBack}>
            חזרה
          </Button>
        )}
        {step < TOTAL_STEPS && <Button onClick={handleNext}>המשך</Button>}
        {step === TOTAL_STEPS && (
          <Button onClick={handleFinish} isLoading={isSaving}>
            כניסה לאפליקציה
          </Button>
        )}
      </div>
    </div>
  );
}

export default OnboardingWizard;
