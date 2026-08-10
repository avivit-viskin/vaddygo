import { useState } from "react";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import {
  isPro,
  grantProLocally,
  revokeProLocally,
  canUnlockProWithoutPaying,
} from "../../services/plan";
import { getActiveInstitution } from "../../services/institutionsService";
import { setGroupPro } from "../../services/groupsService";
import { syncInstitutionsFromServer } from "../../services/onboardingService";
import "../../styles/pro-test.css";

/*
  ProTestControl — פתיחה/סגירה של מסלול פרו למוסד הפעיל, למנהלת VaddyGo בלבד.

  מאז אכיפת הפרו בשרת זהו **כלי ניהול אמיתי**, לא רק מתג-בדיקות: הוא כותב את
  הדגל ל-`Group.IsPro` בשרת, ולכן הפתיחה חלה על כל חברות הוועד ובכל מכשיר —
  וגם החסימה בפועל (סקרים, עוזרת AI) מתיישרת לפיה.

  גבולות: פועל על **המוסד הפעיל בלבד** (השם מוצג במפורש כדי שלא תהיה טעות),
  והשרת מאמת שוב שהמבקשת היא SuperAdmin.

  מוסד שעדיין לא סונכרן לשרת (נוצר אופליין ואין לו serverGroupId) נופל לפתיחה
  מקומית — כדי שאפשר יהיה לבדוק גם לפני שהשרת הכיר אותו.
*/
function ProTestControl() {
  const institution = getActiveInstitution();
  const [unlocked, setUnlocked] = useState(() => isPro());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // שכבת הגנה שנייה: העמוד כולו כבר חסום למי שאינה מנהלת, אבל הרכיב בודק גם
  // בעצמו — כדי שהעברה שלו למסך אחר בעתיד לא תחשוף בטעות פתיחת פרו חינם.
  if (!canUnlockProWithoutPaying()) {
    return null;
  }

  const name = institution?.name || "המוסד הפעיל";
  const groupId = institution?.serverGroupId ?? null;

  async function toggle() {
    const next = !unlocked;
    setIsSaving(true);
    setError("");
    try {
      if (groupId != null) {
        await setGroupPro(groupId, next);
        // מרעננים את המוסדות כדי שהדגל מהשרת יחלחל לכל המסכים
        await syncInstitutionsFromServer();
      } else {
        // מוסד מקומי בלבד — אין למי לשלוח; נשמר בדפדפן
        if (next) {
          grantProLocally();
        } else {
          revokeProLocally();
        }
      }
      setUnlocked(next);
    } catch (err) {
      setError(err.message || "לא הצלחנו לעדכן את מסלול הפרו");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="pro-test">
      <h3 className="pro-test__title">
        <Icon name="crown" size={18} /> מסלול פרו של המוסד
      </h3>

      <p className="pro-test__target">
        המוסד הפעיל: <strong>{name}</strong>
        <span
          className={`pro-test__pill${unlocked ? " pro-test__pill--on" : ""}`}
        >
          {unlocked ? "פרו פתוח" : "פרו נעול"}
        </span>
      </p>

      <div className="pro-test__actions">
        <Button
          variant={unlocked ? "secondary" : "primary"}
          onClick={toggle}
          isLoading={isSaving}
        >
          {unlocked ? "סגירת פרו במוסד הזה" : "פתיחת פרו במוסד הזה"}
        </Button>
      </div>

      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}

      <p className="pro-test__note">
        {groupId != null ? (
          <>
            נשמר <strong>בשרת</strong> ולכן חל על <strong>{name}</strong> בכל
            מכשיר ואצל כל חברות הוועד — בלי חיוב, ובלי להשפיע על מוסדות אחרים.
            כדי לשנות מוסד אחר יש להחליף אליו בתפריט "המוסדות שלי".
          </>
        ) : (
          <>
            המוסד הזה עדיין לא סונכרן לשרת, ולכן הפתיחה תישמר בדפדפן הזה בלבד.
          </>
        )}
      </p>
    </section>
  );
}

export default ProTestControl;
