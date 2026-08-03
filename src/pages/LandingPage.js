import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import Icon from "../components/Icon";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { whatsappUrl } from "../services/whatsapp";
import "../styles/landing.css";

/*
  LandingPage — דף הנחיתה הציבורי של VaddyGo (הכתובת הראשית למי שאינו מחובר).
  מבנה בהשראת אתרי פייבוקס/ביט: ניווט דביק, כותרת-גיבור עם מוקאפ טלפון, רשת
  יכולות, מקטעים מתחלפים, "איך זה עובד" ב-3 צעדים, פס קריאה-לפעולה ופוטר.
  הזהות של VaddyGo: ורוד/רוז, פחם, ופונט Rubik. הכפתורים מובילים להרשמה/כניסה.
*/

const SUPPORT_PHONE = "054-4579179";
const CONTACT_EMAIL = "avivitm91@gmail.com";

// מוקאפ של "טלפון" עם מסך הבית של המערכת — נותן תחושת מוצר אמיתי
function PhoneMock() {
  return (
    <div className="lp-phone" aria-hidden="true">
      <div className="lp-phone__notch" />
      <div className="lp-phone__screen">
        <div className="lp-appbar">
          <span className="lp-appbar__gan">גן הפרחים</span>
          <span className="lp-appbar__avatar">גפ</span>
        </div>

        <div className="lp-collect">
          <span className="lp-collect__label">יתרת הקופה</span>
          <span className="lp-collect__amount">₪ 3,240</span>
          <div className="lp-collect__bar">
            <span style={{ width: "72%" }} />
          </div>
          <span className="lp-collect__meta">נגבו 72% · נשארו 12 הורים</span>
        </div>

        <div className="lp-tiles">
          <div className="lp-tile">
            <span className="lp-tile__name">גבייה</span>
            <span className="lp-tile__val">₪ 6,000</span>
          </div>
          <div className="lp-tile">
            <span className="lp-tile__name">מתנות</span>
            <span className="lp-tile__val">₪ 1,200</span>
          </div>
        </div>

        <div className="lp-mini-nav">
          <span className="is-on"><Icon name="home" size={18} /></span>
          <span><Icon name="users" size={18} /></span>
          <span><Icon name="calendar" size={18} /></span>
          <span><Icon name="gift" size={18} /></span>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: "wallet",
    title: "גבייה ותשלומים",
    text: "עוקבים מי שילם, שולחים בקשת תשלום, ורואים את היתרה בזמן אמת.",
  },
  {
    icon: "users",
    title: "תלמידים והורים",
    text: "רשימת התלמידים, פרטי הקשר, וסטטוס התשלום של כל אחד — במקום אחד.",
  },
  {
    icon: "calendar",
    title: "לוח שנה ואירועים",
    text: "אירועים, ימי הולדת ותזכורות להורים — הכול מסונכרן אוטומטית.",
  },
  {
    icon: "gift",
    title: "מתנות וספקים",
    text: "מתכננים מתנות לחגים, בוחרים מקטלוג ספקים, ושומרים על התקציב.",
  },
  {
    icon: "folder",
    title: "קבצים ומסמכים",
    text: "כל הקבלות והמסמכים החשובים נגישים לכל חברי הוועד.",
  },
  {
    icon: "lock",
    title: "הרשאות לצוות",
    text: "מזמינים חברי ועד עם הרשאה מתאימה: ניהול, עריכה או צפייה בלבד.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "נרשמים חינם",
    text: "פותחים חשבון בכמה קליקים — בלי כרטיס אשראי.",
  },
  {
    n: "2",
    title: "מגדירים את הגן",
    text: "אשף קצר: שם הגן, רשימת התלמידים וסכום הגבייה.",
  },
  {
    n: "3",
    title: "מנהלים במקום אחד",
    text: "וזהו — כל ניהול הוועד מסודר, שקוף וזמין מהנייד.",
  },
];

function LandingPage() {
  return (
    <div className="lp">
      {/* ── ניווט עליון דביק ── */}
      <header className="lp-nav">
        <div className="lp-nav__inner">
          <span className="lp-nav__logo">
            <Logo />
          </span>
          <nav className="lp-nav__actions">
            <Link className="lp-nav__login" to="/login">
              כניסה
            </Link>
            <Link className="lp-btn lp-btn--primary lp-btn--sm" to="/register">
              הרשמה חינם
            </Link>
          </nav>
        </div>
      </header>

      {/* ── גיבור ── */}
      <section className="lp-hero">
        <div className="lp-hero__blob" aria-hidden="true" />
        <div className="lp-hero__inner">
          <div className="lp-hero__text">
            <span className="lp-badge">לוועדי הורים בגנים ובתי ספר</span>
            <h1 className="lp-hero__title">
              כל ניהול הוועד —<br />
              <mark>במקום אחד.</mark>
            </h1>
            <p className="lp-hero__sub">
              גבייה, תשלומים, תלמידים, אירועים, מתנות וספקים — הכול מסודר במקום
              אחד, פשוט וברור. בלי אקסלים ובלי בלגן.
            </p>
            <div className="lp-hero__cta">
              <Link className="lp-btn lp-btn--primary lp-btn--lg" to="/register">
                הרשמה חינם
              </Link>
              <Link className="lp-btn lp-btn--ghost lp-btn--lg" to="/login">
                יש לי כבר חשבון
              </Link>
            </div>
            <p className="lp-hero__note">
              <Icon name="check" size={15} /> התחלה חינם · בלי כרטיס אשראי
            </p>
          </div>
          <div className="lp-hero__art">
            <PhoneMock />
          </div>
        </div>
      </section>

      {/* ── פס ערכים ── */}
      <div className="lp-strip">
        <span><Icon name="check" size={16} /> הכול במקום אחד</span>
        <span><Icon name="check" size={16} /> שקוף מול ההורים</span>
        <span><Icon name="check" size={16} /> עובד מהנייד</span>
      </div>

      {/* ── ערך מרכזי + רשת יכולות ── */}
      <section className="lp-section">
        <div className="lp-section__head">
          <h2 className="lp-h2">הרבה יותר מגבייה</h2>
          <p className="lp-lead">
            VaddyGo מרכזת בשבילכם את כל מה שוועד הורים צריך — כדי שתשקיעו את הזמן
            בילדים, לא בניירת.
          </p>
        </div>

        <div className="lp-grid">
          {FEATURES.map((f) => (
            <article className="lp-card" key={f.title}>
              <span className="lp-card__icon">
                <Icon name={f.icon} size={24} />
              </span>
              <h3 className="lp-card__title">{f.title}</h3>
              <p className="lp-card__text">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── מקטע מתחלף 1: גבייה שקופה ── */}
      <section className="lp-feature lp-feature--tint">
        <div className="lp-feature__inner">
          <div className="lp-feature__text">
            <h2 className="lp-h2">גבייה שקופה, בלי כאב ראש</h2>
            <p className="lp-lead">
              רואים בכל רגע כמה נגבה, ממי, וכמה עוד חסר. שולחים תזכורת בלחיצה,
              והכול נשאר מסודר — בלי טבלאות ובלי לרדוף אחרי אף אחד.
            </p>
            <ul className="lp-checks">
              <li><Icon name="check" size={18} /> יתרת קופה מתעדכנת בזמן אמת</li>
              <li><Icon name="check" size={18} /> סטטוס תשלום לכל תלמיד</li>
              <li><Icon name="check" size={18} /> בקשות תשלום ותזכורות בוואטסאפ</li>
            </ul>
          </div>
          <div className="lp-feature__art">
            <div className="lp-snippet">
              <span className="lp-snippet__label">יתרת הקופה</span>
              <span className="lp-snippet__amount">₪ 3,240</span>
              <div className="lp-snippet__bar"><span style={{ width: "72%" }} /></div>
              <div className="lp-snippet__rows">
                <div><span>דניאל כהן</span><b className="is-paid">שולם</b></div>
                <div><span>מיה לוי</span><b className="is-paid">שולם</b></div>
                <div><span>יואב אבני</span><b className="is-due">ממתין</b></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── מקטע מתחלף 2: הרשאות ── */}
      <section className="lp-feature lp-feature--flip">
        <div className="lp-feature__inner">
          <div className="lp-feature__text">
            <h2 className="lp-h2">כל חבר ועד — וההרשאה שמתאימה לו</h2>
            <p className="lp-lead">
              מזמינים חברי ועד בקישור אחד, וכל אחד מקבל בדיוק את מה שהוא צריך:
              ניהול מלא, עריכה, או צפייה בלבד. שקוף, מסודר, ובשליטה מלאה שלכם.
            </p>
            <ul className="lp-checks">
              <li><Icon name="check" size={18} /> הזמנה בקישור — בלי סיסמאות מסובכות</li>
              <li><Icon name="check" size={18} /> ניהול / עריכה / צפייה בלבד</li>
              <li><Icon name="check" size={18} /> הנתונים שלכם מוגנים ומופרדים לכל גן</li>
            </ul>
          </div>
          <div className="lp-feature__art">
            <div className="lp-snippet">
              <span className="lp-snippet__label">חברי הוועד</span>
              <div className="lp-roles">
                <div><span className="lp-ava">רב</span><span>רות ברק</span><b className="lp-role lp-role--owner">בעלים</b></div>
                <div><span className="lp-ava">אנ</span><span>אורי נחום</span><b className="lp-role lp-role--edit">עריכה</b></div>
                <div><span className="lp-ava">שט</span><span>שירה טל</span><b className="lp-role lp-role--view">צפייה</b></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── איך זה עובד ── */}
      <section className="lp-section">
        <div className="lp-section__head">
          <h2 className="lp-h2">מתחילים ב-3 צעדים</h2>
        </div>
        <div className="lp-steps">
          {STEPS.map((s) => (
            <div className="lp-step" key={s.n}>
              <span className="lp-step__num">{s.n}</span>
              <h3 className="lp-step__title">{s.title}</h3>
              <p className="lp-step__text">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── פס קריאה לפעולה ── */}
      <section className="lp-cta">
        <h2 className="lp-cta__title">מוכנים להתחיל?</h2>
        <p className="lp-cta__sub">
          הצטרפו לוועדים שכבר מנהלים חכם עם VaddyGo — בחינם, בלי התחייבות.
        </p>
        <Link className="lp-btn lp-btn--onDark lp-btn--lg" to="/register">
          הרשמה חינם
        </Link>
      </section>

      {/* ── פוטר ── */}
      <footer className="lp-foot">
        <div className="lp-foot__inner">
          <div className="lp-foot__brand">
            <span className="lp-foot__logo"><Logo /></span>
            <p className="lp-foot__tag">ארגון חכם. ניהול מנצח.</p>
          </div>
          <div className="lp-foot__col">
            <h4>יצירת קשר</h4>
            <a href={whatsappUrl(SUPPORT_PHONE)} target="_blank" rel="noreferrer">
              <WhatsAppIcon size={16} /> {SUPPORT_PHONE}
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`}>
              <Icon name="message" size={16} /> {CONTACT_EMAIL}
            </a>
          </div>
          <div className="lp-foot__col">
            <h4>מידע</h4>
            <Link to="/privacy">מדיניות פרטיות</Link>
            <Link to="/terms">תנאי שימוש</Link>
            <Link to="/accessibility">נגישות</Link>
          </div>
          <div className="lp-foot__col">
            <h4>התחלה</h4>
            <Link to="/register">הרשמה חינם</Link>
            <Link to="/login">כניסה לחשבון</Link>
          </div>
        </div>
        <p className="lp-foot__copy">© {new Date().getFullYear()} VaddyGo · כל הזכויות שמורות</p>
      </footer>
    </div>
  );
}

export default LandingPage;
