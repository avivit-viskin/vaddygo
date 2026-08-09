/*
  analytics — מדידה (Google Analytics 4 + פיקסל פייסבוק). עקרון-על: קוד המעקב
  נטען *אך ורק* אחרי שהמשתמש/ת אישרה עוגיות מדידה (applyAnalyticsConsent(true)),
  כפי שהחוק דורש. לפני אישור — לא נטען כלום ולא נשלח אף אירוע.

  המזהים מגיעים ממשתני סביבה (REACT_APP_GA_ID / REACT_APP_FB_PIXEL_ID) או
  מהקבועים כאן. מזהה ריק = פשוט לא טוענים את אותו ספק (בטוח עד שמזינים אותו).
*/

// מזהי המדידה — ממלאים כאן (או ב-REACT_APP_*) אחרי פתיחת החשבונות.
// GA4: נראה כמו "G-XXXXXXXXXX".  פיקסל פייסבוק: מספר, למשל "1234567890123456".
const GA_ID = process.env.REACT_APP_GA_ID || "";
const FB_PIXEL_ID = process.env.REACT_APP_FB_PIXEL_ID || "";

let loaded = false;

/*
  מפעיל/מכבה מעקב לפי בחירת העוגיות. מקבל boolean מבחוץ (בלי תלות מעגלית
  בשירות ההסכמה): נקרא מבאנר האישור, מההגדרות, ובעליית האפליקציה.
*/
export function applyAnalyticsConsent(consented) {
  if (consented) {
    load();
  } else {
    unload();
  }
}

/*
  צפיית עמוד (page view) — נקרא בכל מעבר מסך (SPA). לא עושה כלום אם המעקב לא
  נטען (כלומר לא אושרו עוגיות) — אז אפשר לקרוא לו בבטחה מכל מקום.
*/
export function trackPageView(path) {
  if (!loaded) {
    return;
  }
  if (GA_ID && window.gtag) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }
  if (FB_PIXEL_ID && window.fbq) {
    window.fbq("track", "PageView");
  }
}

function load() {
  if (loaded) {
    return;
  }
  loaded = true;
  loadGoogleAnalytics();
  loadFacebookPixel();
  // צפיית העמוד הראשונה, מיד אחרי האישור (המעברים הבאים נשלחים מ-App לפי הנתיב)
  trackPageView(window.location.pathname + window.location.search);
}

function loadGoogleAnalytics() {
  if (!GA_ID || window.gtag) {
    return;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  // send_page_view:false — אנחנו שולחים צפיות ידנית לפי הנתיב (SPA), בלי כפילות
  window.gtag("config", GA_ID, {
    anonymize_ip: true,
    send_page_view: false,
  });
}

function loadFacebookPixel() {
  if (!FB_PIXEL_ID || window.fbq) {
    return;
  }
  const fbq = function fbq() {
    // eslint-disable-next-line prefer-rest-params
    if (fbq.callMethod) {
      // eslint-disable-next-line prefer-rest-params
      fbq.callMethod.apply(fbq, arguments);
    } else {
      // eslint-disable-next-line prefer-rest-params
      fbq.queue.push(arguments);
    }
  };
  window.fbq = fbq;
  if (!window._fbq) {
    window._fbq = fbq;
  }
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const first = document.getElementsByTagName("script")[0];
  first.parentNode.insertBefore(script, first);

  window.fbq("init", FB_PIXEL_ID);
}

function unload() {
  // לא אישרו (או ביטלו) → לא טוענים מעקב. אם המעקב כבר נטען בסשן הנוכחי,
  // מפסיקים לשלוח אירועים (הסקריפטים שכבר עלו יוסרו ברענון הבא).
  loaded = false;
}
