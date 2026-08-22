import { useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Card from "../components/Card";
import Icon from "../components/Icon";
import { logout, getUser, isAuthenticated } from "../services/authService";
import { getInstitutions } from "../services/institutionsService";
import { whatsappUrl } from "../services/whatsapp";
import { PRO_PAYMENT_URL } from "../config/payment";
import "../styles/onboarding.css";

/*
  SubscriptionExpiredPage — המסך שרואים כשתוקף המנוי או תקופת הניסיון הסתיימו.

  שני דברים שהמסך הזה חייב לעשות, ולא עשה קודם:

  1. **לומר על איזה מוסד מדובר, בשם.** מנהלת ועד יכולה לנהל כמה מוסדות, וגם
     מי שמנהלת אחד רוצה לראות שהמערכת יודעת מי היא. "תוקף המנוי הסתיים" בלי
     שם נקרא כמו הודעה גנרית של מערכת שלא מזהה אותך.

  2. **לתת דרך יציאה שאינה תשלום.** קודם היו רק "חידוש" ו"התנתקות" — מי
     שאינה רוצה לחדש עכשיו נשארה בלי שום מסלול, כאילו החשבון נעלם. נוספה
     הרשמה מחדש (חשבון חדש, תקופת ניסיון חדשה), עם אזהרה ברורה שזה **חשבון
     נפרד** והנתונים הקיימים לא עוברים אליו.

  הנתונים הקיימים אינם נמחקים בשום מסלול — וזה נאמר במפורש, כי זה החשש
  הראשון של מי שנתקעת כאן.
*/
const RENEW_PHONE = "054-4579179";

function SubscriptionExpiredPage() {
  const navigate = useNavigate();
  const user = getUser();
  const institutions = getInstitutions();

  /*
    שם המוסד לחידוש. אם יש כמה — מציגים את כולם, כי החידוש הוא על החשבון
    ומשפיע על כולם, ומנהלת צריכה לדעת מה בדיוק חוזר לפעול.
  */
  const names = institutions.map((i) => i.name).filter(Boolean);
  const primaryName = names[0] || "";

  const renewMessage = primaryName
    ? `היי, אשמח לחדש את המנוי ב-VaddyGo עבור "${primaryName}" 🙂`
    : "היי, אשמח לחדש את המנוי שלי ב-VaddyGo 🙂";
  const renewHref = `${whatsappUrl(RENEW_PHONE)}?text=${encodeURIComponent(renewMessage)}`;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  /*
    הרשמה מחדש = חשבון חדש לגמרי. מתנתקים תחילה, אחרת מסך ההרשמה נטען עם
    טוקן ישן שפג ומתנהג באופן בלתי צפוי.
  */
  function handleRegisterAgain() {
    logout();
    navigate("/register");
  }

  return (
    <div className="auth-page">
      <h1 className="auth-page__logo">
        <BrandName withHeart />
      </h1>
      <Card title="תוקף המנוי הסתיים 🗓️">
        {primaryName ? (
          <p className="welcome__text" style={{ textAlign: "right", margin: "0 0 12px" }}>
            תוקף המנוי של <strong>{primaryName}</strong> ב-<BrandName /> הסתיים.
            {names.length > 1 && (
              <>
                {" "}
                החידוש יפעיל מחדש את כל המוסדות בחשבון: {names.join(", ")}.
              </>
            )}
          </p>
        ) : (
          <p className="welcome__text" style={{ textAlign: "right", margin: "0 0 12px" }}>
            תוקף המנוי שלך ב-<BrandName /> הסתיים.
          </p>
        )}

        <p className="welcome__text" style={{ textAlign: "right", margin: "0 0 12px" }}>
          <strong>כל הנתונים שלך שמורים ומחכים לך</strong> — התלמידים, הגבייה
          והתקציב. שום דבר לא נמחק.
        </p>

        <div className="auth-page__actions">
          {/*
            🔴 דרך חזרה למערכת — הפריט שחסר כאן וגרם למלכודת אמיתית.

            מאז שסיום הניסיון אינו חוסם, המסך הזה אינו "קיר" אלא עמוד חידוש
            שאפשר להגיע אליו גם בקישור ישיר. בלי כפתור חזרה, מי שנחת עליו
            נשאר בלי מוצא: "התנתקות" מחזירה למסך כניסה, וכניסה מחזירה לאותו
            מקום — לולאה שנראית כמו חסימה שלא הוסרה.
          */}
          {isAuthenticated() && (
            <Button onClick={() => navigate("/")}>
              <Icon name="home" size={16} /> חזרה למערכת
            </Button>
          )}
          {PRO_PAYMENT_URL && (
            <a
              href={PRO_PAYMENT_URL}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none", display: "block" }}
            >
              <Button variant={isAuthenticated() ? "secondary" : "primary"}>
                <Icon name="card" size={16} />{" "}
                {primaryName ? `חידוש המנוי עבור ${primaryName}` : "חידוש המנוי"}
              </Button>
            </a>
          )}
          <a
            href={renewHref}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none", display: "block" }}
          >
            <Button variant="secondary">
              <Icon name="message" size={16} /> חידוש בוואטסאפ
            </Button>
          </a>
        </div>

        {/*
          מסלול שני — למי שאינה רוצה לחדש עכשיו. מופרד בקו ובהסבר, כדי שלא
          ייראה כמו חלופה שקולה לחידוש ולא ילחצו עליו בטעות.
        */}
        <hr
          style={{
            margin: "18px 0 12px",
            border: 0,
            borderTop: "1px solid var(--color-border)",
          }}
        />
        <p
          className="welcome__text"
          style={{ textAlign: "right", margin: "0 0 10px", fontSize: "0.92rem" }}
        >
          לא רוצה לחדש עכשיו? אפשר להתחיל <strong>חשבון חדש</strong> עם תקופת
          ניסיון. שימי לב: זה חשבון נפרד —{" "}
          <strong>הנתונים של {primaryName || "המוסד הקיים"} לא יעברו אליו</strong>,
          והם יישארו שמורים כאן אם תחליטי לחדש בהמשך.
        </p>
        <div className="auth-page__actions">
          <Button variant="secondary" onClick={handleRegisterAgain}>
            <Icon name="plus" size={16} /> הרשמה מחדש (חשבון חדש)
          </Button>
          <Button variant="secondary" onClick={handleLogout}>
            התנתקות
          </Button>
        </div>

        {user?.email && (
          <p
            style={{
              textAlign: "right",
              margin: "12px 0 0",
              fontSize: "0.85rem",
              color: "var(--color-text-muted)",
            }}
          >
            מחוברת כ-{user.email}
          </p>
        )}
      </Card>
    </div>
  );
}

export default SubscriptionExpiredPage;
