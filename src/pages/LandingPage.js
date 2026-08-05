import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import Icon from "../components/Icon";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { whatsappUrl } from "../services/whatsapp";
import homeShot from "../assets/screenshots/home.jpg";
import studentsShot from "../assets/screenshots/students.jpg";
import permissionsShot from "../assets/screenshots/permissions.jpg";
import "../styles/landing.css";

/*
  LandingPage — דף הנחיתה הציבורי של VaddyGo (הכתובת הראשית למי שאינו מחובר).
  פלטה תואמת לאפליקציה (בז' בהיר + ורוד רך + פחם, פונט Rubik). צילומי מסך אמיתיים
  בתוך מסגרות טלפון, צ'יפים מרחפים שמתחלפים, רצועת יכולות נעה, וסיפור "מי אנחנו".
*/

const SUPPORT_PHONE = "054-4579179";
const CONTACT_EMAIL = "avivitm91@gmail.com";

// תוכן שמתחלף בצ'יפים המרחפים (כדי שהבאנר "יזוז כל הזמן על שמות אחרים")
const PAID = ["דנה כהן", "יואב אבני", "מיה לוי", "נועה בר", "איתי טל", "שירה רון", "עמית פז", "רוני דגן"];
const AMOUNTS = ["250 ₪ התקבל", "180 ₪ התקבל", "500 ₪ התקבל", "120 ₪ התקבל", "340 ₪ התקבל"];
const EVENTS = [
  { icon: "cake", text: "יום הולדת של דנה" },
  { icon: "gift", text: "מתנה לחג נרכשה" },
  { icon: "calendar", text: "טיול שנתי בקרוב" },
  { icon: "check", text: "12 הורים שילמו היום" },
];
const initials = (name) => name.split(" ").map((w) => w[0]).join("").slice(0, 2);

function useRotator(len, ms) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (typeof setInterval !== "function") return undefined;
    const id = setInterval(() => setI((v) => (v + 1) % len), ms);
    return () => clearInterval(id);
  }, [len, ms]);
  return i;
}

// מסגרת טלפון עם צילום מסך אמיתי של האפליקציה
function Phone({ src, alt, float = false }) {
  return (
    <div className={`lp-phone${float ? "" : " lp-phone--calm"}`}>
      <div className="lp-phone__cam" />
      <div className="lp-phone__screen">
        <img className="lp-phone__img" src={src} alt={alt} loading="lazy" />
      </div>
    </div>
  );
}

// רצועת יכולות גדולה ונעה
const MARQUEE = [
  { icon: "wallet", label: "גבייה ותשלומים" },
  { icon: "users", label: "תלמידים והורים" },
  { icon: "calendar", label: "לוח שנה ואירועים" },
  { icon: "gift", label: "מתנות וספקים" },
  { icon: "folder", label: "קבצים ומסמכים" },
  { icon: "lock", label: "הרשאות לצוות" },
  { icon: "robot", label: "עוזרת AI" },
  { icon: "bell", label: "תזכורות בוואטסאפ" },
];
function FeaturesMarquee() {
  const row = [...MARQUEE, ...MARQUEE];
  return (
    <div className="lp-fmarquee" aria-hidden="true">
      <div className="lp-fmarquee__track">
        {row.map((f, idx) => (
          <div className="lp-fcard" key={idx}>
            <span className="lp-fcard__ic"><Icon name={f.icon} size={24} /></span>
            <span className="lp-fcard__label">{f.label}</span>
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

const FOUNDERS = [
  { name: "שובל לוי", role: "מייסדת ויזמית" },
  { name: "אביבית ויסקין", role: "מייסדת ויזמית" },
];

const FAQ = [
  {
    q: "מה זה VaddyGo ולמי זה מתאים?",
    a: "VaddyGo היא מערכת לניהול ועד הורים בגנים ובבתי ספר. היא מרכזת במקום אחד את הגבייה, התשלומים, רשימת התלמידים, האירועים, המתנות והספקים — כדי שכל חבר ועד יוכל לנהל את הכול בקלות מהנייד, בלי אקסלים ובלי בלגן.",
  },
  {
    q: "מה ההבדל בין VaddyGo לאקסל?",
    a: "אקסל הוא טבלה — VaddyGo היא מערכת. במקום נוסחאות שנשברות, גרסאות שמתפזרות והודעות שאובדות, הכול מחובר ומתעדכן לבד: יתרת הקופה, מי שילם, אילו אירועים מתקרבים ומה נשאר בתקציב. הכול נגיש מהנייד לכל חברי הוועד לפי הרשאות, עם תזכורות בוואטסאפ בלחיצה — בלי כאב הראש של אקסל משותף.",
  },
  {
    q: "כמה זה עולה?",
    a: "אפשר להתחיל בחינם — פותחים חשבון, מגדירים את הגן ומתחילים לעבוד, בלי כרטיס אשראי ובלי התחייבות.",
  },
  {
    q: "האם VaddyGo מחזיקה את הכסף שלנו?",
    a: "לא. VaddyGo היא כלי ניהול ומעקב בלבד — היא לא מחזיקה כסף ולא גובה תשלומים. אתם רואים מי שילם וכמה, אבל הכסף עובר ישירות (מזומן, העברה, ביט או פייבוקס) בין ההורים לוועד ובין הוועד לספקים.",
  },
  {
    q: "איך עוקבים אחרי הגבייה והתשלומים?",
    a: "רושמים כל תשלום לפי אמצעי התשלום — מזומן, אשראי, ביט או פייבוקס — ורואים בזמן אמת כמה נגבה, ממי, וכמה עוד חסר. אפשר לשלוח להורים בקשת תשלום או תזכורת בוואטסאפ בלחיצה.",
  },
  {
    q: "האם ההורים צריכים להירשם גם?",
    a: "לא. רק חברי הוועד עובדים עם VaddyGo. ההורים לא צריכים חשבון ולא צריכים להתקין כלום — הוועד מנהל את הגבייה, ושולח להורים בקשת תשלום או תזכורת בוואטסאפ עם קישור נוח, בלי לערב אותם במערכת.",
  },
  {
    q: "אפשר לצרף עוד חברי ועד? ומה כל אחד יכול לראות?",
    a: "בהחלט. מזמינים חברי ועד בקישור אחד, וכל אחד מקבל את ההרשאה שמתאימה לו: ניהול מלא, עריכה, או צפייה בלבד. כך שומרים על סדר — לא כולם יכולים לשנות הכול.",
  },
  {
    q: "הנתונים שלנו מאובטחים?",
    a: "כן. הנתונים של כל גן מופרדים ומוגנים, וההרשאות נאכפות בשרת עצמו (לא רק בהסתרת כפתורים) — כך שחבר ועד עם הרשאת 'צפייה' באמת לא יכול לערוך כלום.",
  },
  {
    q: "אפשר לייצא את הנתונים?",
    a: "הנתונים שלכם תמיד שלכם ונשמרים באופן מאובטח, ואפשר לייבא רשימות (כמו רשימת התלמידים) מקובץ. אם תצטרכו לייצא או לגבות נתונים — פנו אלינו ונשמח לעזור.",
  },
  {
    q: "צריך להתקין אפליקציה?",
    a: "לא צריך. VaddyGo עובדת ישירות מהדפדפן, בנייד ובמחשב. אפשר גם להוסיף אותה למסך הבית של הטלפון ולעבוד איתה בדיוק כמו אפליקציה.",
  },
  {
    q: "יש לי כמה גנים או כמה כיתות — אפשר לנהל את כולם?",
    a: "כן. אפשר לנהל כמה מוסדות מאותו חשבון ולעבור ביניהם בקלות, כשהנתונים של כל אחד נשמרים בנפרד.",
  },
  {
    q: "מה קורה בסוף השנה כשמתחלף הוועד?",
    a: "הנתונים וההיסטוריה נשארים במקום — הם שייכים לגן. כשמתחלף הוועד פשוט מזמינים את החברים החדשים בקישור ומעדכנים הרשאות, וכל אחד ממשיך בדיוק מאיפה שהפסיקו. המערכת גם יודעת לבד באיזו שנת לימודים אתם.",
  },
  {
    q: "איך מתחילים?",
    a: "נרשמים בחינם, עוברים אשף קצר (שם הגן, רשימת התלמידים וסכום הגבייה) — וזהו, אפשר להתחיל לנהל. לוקח כחמש דקות.",
  },
];

function LandingPage() {
  const tick = useRotator(8, 2200);
  const paidName = PAID[tick % PAID.length];
  const amount = AMOUNTS[tick % AMOUNTS.length];
  const ev = EVENTS[tick % EVENTS.length];

  return (
    <div className="lp">
      {/* ── ניווט עליון (לוגו בלבד — ההרשמה/כניסה נמצאות בבאנר) ── */}
      <header className="lp-nav">
        <div className="lp-nav__inner">
          <span className="lp-nav__logo"><Logo /></span>
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
            <p className="lp-hero__note"><Icon name="check" size={16} /> התחלה חינם · בלי כרטיס אשראי</p>
          </div>

          <div className="lp-hero__art">
            <div className="lp-stage">
              <Phone src={homeShot} alt="מסך הבית של VaddyGo" float />
              {/* צ'יפים מרחפים שמתחלפים כל הזמן */}
              <div className="lp-chip lp-chip--pay">
                <span className="lp-chip__dot">₪</span>
                <span className="lp-chip__swap" key={amount}>{amount}</span>
              </div>
              <div className="lp-chip lp-chip--kid">
                <span className="lp-chip__ava">{initials(paidName)}</span>
                <span className="lp-chip__swap" key={paidName}>{paidName.split(" ")[0]} · שולם ✓</span>
              </div>
              <div className="lp-chip lp-chip--bday">
                <Icon name={ev.icon} size={16} />
                <span className="lp-chip__swap" key={ev.text}>{ev.text}</span>
              </div>
              <div className="lp-chip lp-chip--bit">bit</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── רצועת יכולות גדולה ונעה ── */}
      <FeaturesMarquee />

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

      {/* ── מקטע מתחלף 1: תלמידים ותשלומים (צילום אמיתי) ── */}
      <section className="lp-feature lp-feature--tint">
        <div className="lp-feature__inner">
          <div className="lp-feature__text">
            <h2 className="lp-h2">גבייה שקופה,<br />בלי כאב ראש</h2>
            <p className="lp-lead">
              רואים בכל רגע מי שילם וכמה עוד חסר, שולחים בקשת תשלום בלחיצה,
              והכול נשאר מסודר — בלי טבלאות ובלי לרדוף אחרי אף אחד.
            </p>
            <ul className="lp-checks">
              <li><Icon name="check" size={20} /> יתרת קופה מתעדכנת בזמן אמת</li>
              <li><Icon name="check" size={20} /> סטטוס תשלום לכל תלמיד</li>
              <li><Icon name="check" size={20} /> בקשות תשלום ותזכורות בוואטסאפ</li>
            </ul>
          </div>
          <div className="lp-feature__art"><Phone src={studentsShot} alt="מסך התלמידים והתשלומים" /></div>
        </div>
      </section>

      {/* ── מקטע מתחלף 2: הרשאות (צילום אמיתי) ── */}
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
          <div className="lp-feature__art"><Phone src={permissionsShot} alt="מסך חברי הוועד וההרשאות" /></div>
        </div>
      </section>

      {/* ── מי אנחנו ── */}
      <section className="lp-about">
        <div className="lp-about__inner">
          <div className="lp-about__text">
            <span className="lp-eyebrow">מי אנחנו</span>
            <h2 className="lp-h2">הכול התחיל בבית קפה</h2>
            <p>
              שתי אמהות, חברות ועד, ישבו מול קפה מתקרר וערימה של טבלאות אקסל,
              קבלות מקומטות והודעות שאבדו אי-שם בוואטסאפ. היינו מותשות מהבלגן —
              מהרדיפה אחרי תשלומים, מהניסיון לזכור מי שילם ומי עדיין לא, ומהתחושה
              שכל הזמן משהו נופל בין הכיסאות.
            </p>
            <p>
              ואז אמרנו את המשפט ששינה הכול: <em>"אם רק היה כלי אחד שמאגד את הכול"</em>.
              שלפנו טלפונים, התחלנו לזרוק רעיונות, וחלמנו איך זה היה נראה אם ניהול
              ועד הורים היה פשוט, שקוף ונעים. מתוך התסכול הזה נולדה VaddyGo — מערכת
              אחת שמרכזת את כל מה שוועד צריך, כדי שתשקיעו את הזמן במה שבאמת חשוב:
              הילדים.
            </p>
          </div>
          <div className="lp-about__team">
            {FOUNDERS.map((f) => (
              <div className="lp-founder" key={f.name}>
                <span className="lp-founder__ava">{initials(f.name)}</span>
                <b className="lp-founder__name">{f.name}</b>
                <span className="lp-founder__role">{f.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── איך זה עובד ── */}
      <section className="lp-section">
        <div className="lp-section__head"><h2 className="lp-h2">מתחילים ב-3 צעדים</h2></div>
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

      {/* ── שאלות ותשובות ── */}
      <section className="lp-section lp-faq">
        <div className="lp-section__head">
          <span className="lp-eyebrow">שאלות ותשובות</span>
          <h2 className="lp-h2">כל מה שרציתם לדעת</h2>
        </div>
        <div className="lp-faq__list">
          {FAQ.map((item) => (
            <details className="lp-faq__item" key={item.q}>
              <summary className="lp-faq__q">
                <span>{item.q}</span>
                <span className="lp-faq__icon" aria-hidden="true">+</span>
              </summary>
              <div className="lp-faq__a">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ── קאבר קריאה-לפעולה ── */}
      <section className="lp-cta">
        <div className="lp-cta__inner">
          <span className="lp-cta__deco lp-cta__deco--1" aria-hidden="true" />
          <span className="lp-cta__deco lp-cta__deco--2" aria-hidden="true" />
          <h2 className="lp-cta__title">מוכנים להתחיל?</h2>
          <p className="lp-cta__sub">
            הצטרפו לוועדים שכבר מנהלים חכם עם VaddyGo — בחינם, בלי התחייבות.
          </p>
          <Link className="lp-btn lp-btn--onDark lp-btn--lg" to="/register">הרשמה חינם</Link>
          <p className="lp-cta__note">התחלה חינם · בלי כרטיס אשראי · הקמה ב-5 דקות</p>
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
