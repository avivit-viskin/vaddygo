import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import Icon from "../components/Icon";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { whatsappUrl } from "../services/whatsapp";
import "../styles/landing.css";

/*
  LandingPage — דף הנחיתה הציבורי של VaddyGo (הכתובת הראשית למי שאינו מחובר).
  שפה עיצובית בהשראת פייבוקס/ביט: כותרות ענק, מוקאפ נאמן-למקור של מסך הבית עם
  אלמנטים מרחפים, רצועת תלמידים נעה, ומקטעי יכולות גדולים. זהות VaddyGo: ורוד/רוז,
  פחם, Rubik. הכפתורים מובילים להרשמה/כניסה האמיתיות.
*/

const SUPPORT_PHONE = "054-4579179";
const CONTACT_EMAIL = "avivitm91@gmail.com";

// מוקאפ נאמן של מסך הבית האמיתי (מספרים ידידותיים לתצוגה שיווקית)
function HomeMock() {
  return (
    <div className="lp-app" aria-hidden="true">
      <div className="lp-app__status">
        <span>9:41</span>
        <span className="lp-app__status-icons">
          <Icon name="check" size={12} /> ▮▮▮
        </span>
      </div>

      <div className="lp-app__bar">
        <span className="lp-app__ava">גפ</span>
        <span className="lp-app__logo"><Logo /></span>
        <span className="lp-app__menu">☰</span>
      </div>

      <div className="lp-app__title">
        <span className="lp-app__bell"><Icon name="bell" size={17} /></span>
        <b>גן הפרחים <span className="lp-app__year">תשפ״ו</span></b>
      </div>

      <div className="lp-app__collect">
        <div className="lp-app__collect-top">
          <div>
            <span className="lp-app__k">יתרת הקופה</span>
            <span className="lp-app__amount">₪ 8,450</span>
          </div>
          <span className="lp-app__pct">78% נגבה</span>
        </div>
        <div className="lp-app__bar-track"><span style={{ width: "78%" }} /></div>
        <div className="lp-app__methods">
          <div className="lp-m lp-m--card"><span className="lp-m__ic"><Icon name="card" size={15} /></span><span>אשראי</span></div>
          <div className="lp-m lp-m--cash"><span className="lp-m__ic"><Icon name="wallet" size={15} /></span><span>מזומן</span></div>
          <div className="lp-m lp-m--paybox"><b>payBox</b></div>
          <div className="lp-m lp-m--bit"><b>bit</b></div>
        </div>
      </div>

      <div className="lp-app__sec">
        <span className="lp-app__sec-title"><Icon name="tag" size={14} /> תשלומים לפי קטגוריות</span>
        <div className="lp-app__cats">
          <div className="lp-app__cat"><b>דמי ועד</b><span>יצא 4,800 מתוך 15,000 ₪</span></div>
          <div className="lp-app__cat"><b>חוגים</b><span>יצא 9,200 מתוך 12,000 ₪</span></div>
        </div>
      </div>

      <div className="lp-app__nav">
        <span><Icon name="folder" size={17} /></span>
        <span><Icon name="gift" size={17} /></span>
        <span><Icon name="calendar" size={17} /></span>
        <span><Icon name="users" size={17} /></span>
        <span className="is-on"><Icon name="home" size={17} /></span>
      </div>
    </div>
  );
}

// רצועת תלמידים נעה — "רשימת תלמידים" חיה שזזה, בנושא של הדף
const KIDS = [
  { i: "מכ", n: "מיה כהן", ok: true },
  { i: "יא", n: "יואב אבני", ok: true },
  { i: "נל", n: "נועה לוי", ok: false },
  { i: "אב", n: "איתי בר", ok: true },
  { i: "שט", n: "שירה טל", ok: true },
  { i: "ער", n: "עמית רון", ok: true },
  { i: "רד", n: "רוני דגן", ok: false },
  { i: "יפ", n: "יעל פז", ok: true },
];
function StudentsMarquee() {
  const row = [...KIDS, ...KIDS];
  return (
    <div className="lp-marquee" aria-hidden="true">
      <div className="lp-marquee__track">
        {row.map((k, idx) => (
          <div className="lp-kid" key={idx}>
            <span className="lp-kid__ava">{k.i}</span>
            <span className="lp-kid__name">{k.n}</span>
            <span className={`lp-kid__badge${k.ok ? " is-ok" : ""}`}>
              {k.ok ? "שולם ✓" : "ממתין"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: "wallet", title: "גבייה ותשלומים", text: "עוקבים מי שילם, שולחים בקשת תשלום, ורואים את היתרה בזמן אמת." },
  { icon: "users", title: "תלמידים והורים", text: "רשימת התלמידים, פרטי הקשר וסטטוס התשלום של כל אחד — במקום אחד." },
  { icon: "calendar", title: "לוח שנה ואירועים", text: "אירועים, ימי הולדת ותזכורות להורים — הכול מסונכרן אוטומטית." },
  { icon: "gift", title: "מתנות וספקים", text: "מתכננים מתנות לחגים, בוחרים מקטלוג ספקים, ושומרים על התקציב." },
  { icon: "folder", title: "קבצים ומסמכים", text: "כל הקבלות והמסמכים החשובים נגישים לכל חברי הוועד." },
  { icon: "lock", title: "הרשאות לצוות", text: "מזמינים חברי ועד עם הרשאה מתאימה: ניהול, עריכה או צפייה בלבד." },
];

const STEPS = [
  { n: "1", title: "נרשמים חינם", text: "פותחים חשבון בכמה קליקים — בלי כרטיס אשראי." },
  { n: "2", title: "מגדירים את הגן", text: "אשף קצר: שם הגן, רשימת התלמידים וסכום הגבייה." },
  { n: "3", title: "מנהלים במקום אחד", text: "וזהו — כל ניהול הוועד מסודר, שקוף וזמין מהנייד." },
];

function LandingPage() {
  return (
    <div className="lp">
      {/* ── ניווט עליון דביק ── */}
      <header className="lp-nav">
        <div className="lp-nav__inner">
          <span className="lp-nav__logo"><Logo /></span>
          <nav className="lp-nav__actions">
            <Link className="lp-nav__login" to="/login">כניסה</Link>
            <Link className="lp-btn lp-btn--primary lp-btn--sm" to="/register">הרשמה חינם</Link>
          </nav>
        </div>
      </header>

      {/* ── גיבור ── */}
      <section className="lp-hero">
        <span className="lp-hero__blob lp-hero__blob--a" aria-hidden="true" />
        <span className="lp-hero__blob lp-hero__blob--b" aria-hidden="true" />
        <div className="lp-hero__inner">
          <div className="lp-hero__text">
            <h1 className="lp-hero__title">
              כל ניהול הוועד,<br />
              <mark>במקום אחד.</mark>
            </h1>
            <p className="lp-hero__sub">
              גבייה, תשלומים, תלמידים, אירועים, מתנות וספקים — הכול מסודר במקום
              אחד, פשוט וברור. בלי אקסלים ובלי בלגן.
            </p>
            <div className="lp-hero__cta">
              <Link className="lp-btn lp-btn--primary lp-btn--lg" to="/register">הרשמה חינם</Link>
              <Link className="lp-btn lp-btn--ghost lp-btn--lg" to="/login">יש לי כבר חשבון</Link>
            </div>
            <p className="lp-hero__note">
              <Icon name="check" size={16} /> התחלה חינם · בלי כרטיס אשראי
            </p>
          </div>

          <div className="lp-hero__art">
            <div className="lp-stage">
              <div className="lp-phone">
                <div className="lp-phone__cam" />
                <div className="lp-phone__screen"><HomeMock /></div>
              </div>
              {/* אלמנטים מרחפים בנושא הדף */}
              <div className="lp-chip lp-chip--pay">
                <span className="lp-chip__dot">₪</span> 250 ₪ התקבל
              </div>
              <div className="lp-chip lp-chip--kid">
                <span className="lp-chip__ava">דנ</span> דנה · שולם ✓
              </div>
              <div className="lp-chip lp-chip--bday">
                <Icon name="cake" size={16} /> יום הולדת השבוע
              </div>
              <div className="lp-chip lp-chip--bit">bit</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── פס ערכים ── */}
      <div className="lp-strip">
        <span><Icon name="check" size={18} /> הכול במקום אחד</span>
        <span><Icon name="check" size={18} /> שקוף מול ההורים</span>
        <span><Icon name="check" size={18} /> עובד מהנייד</span>
      </div>

      {/* ── רצועת תלמידים נעה ── */}
      <StudentsMarquee />

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
              <span className="lp-card__icon"><Icon name={f.icon} size={26} /></span>
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
            <h2 className="lp-h2">גבייה שקופה,<br />בלי כאב ראש</h2>
            <p className="lp-lead">
              רואים בכל רגע כמה נגבה, ממי, וכמה עוד חסר. שולחים תזכורת בלחיצה,
              והכול נשאר מסודר — בלי טבלאות ובלי לרדוף אחרי אף אחד.
            </p>
            <ul className="lp-checks">
              <li><Icon name="check" size={20} /> יתרת קופה מתעדכנת בזמן אמת</li>
              <li><Icon name="check" size={20} /> סטטוס תשלום לכל תלמיד</li>
              <li><Icon name="check" size={20} /> בקשות תשלום ותזכורות בוואטסאפ</li>
            </ul>
          </div>
          <div className="lp-feature__art">
            <div className="lp-snippet lp-snippet--lg">
              <span className="lp-snippet__label">יתרת הקופה</span>
              <span className="lp-snippet__amount">₪ 8,450</span>
              <div className="lp-snippet__bar"><span style={{ width: "78%" }} /></div>
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
            <h2 className="lp-h2">כל חבר ועד —<br />וההרשאה שמתאימה לו</h2>
            <p className="lp-lead">
              מזמינים חברי ועד בקישור אחד, וכל אחד מקבל בדיוק את מה שהוא צריך:
              ניהול מלא, עריכה, או צפייה בלבד. שקוף, מסודר, ובשליטה מלאה שלכם.
            </p>
            <ul className="lp-checks">
              <li><Icon name="check" size={20} /> הזמנה בקישור — בלי סיסמאות מסובכות</li>
              <li><Icon name="check" size={20} /> ניהול / עריכה / צפייה בלבד</li>
              <li><Icon name="check" size={20} /> הנתונים שלכם מוגנים ומופרדים לכל גן</li>
            </ul>
          </div>
          <div className="lp-feature__art">
            <div className="lp-snippet lp-snippet--lg">
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
        <div className="lp-cta__inner">
          <h2 className="lp-cta__title">מוכנים להתחיל?</h2>
          <p className="lp-cta__sub">
            הצטרפו לוועדים שכבר מנהלים חכם עם VaddyGo — בחינם, בלי התחייבות.
          </p>
          <Link className="lp-btn lp-btn--onDark lp-btn--lg" to="/register">הרשמה חינם</Link>
        </div>
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
