import { useCallback, useState } from "react";
import useApi from "../hooks/useApi";
import Card from "../components/Card";
import Icon from "../components/Icon";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import BrandName from "../components/BrandName";
import UsageFunnel from "./admin/UsageFunnel";
import ProTestControl from "./admin/ProTestControl";
import SubscriptionsCard from "./admin/SubscriptionsCard";
import BroadcastCard from "./admin/BroadcastCard";
import SecurityStatusCard from "./admin/SecurityStatusCard";
import ResetDisplayControl from "./admin/ResetDisplayControl";
import { getUsageStats } from "../services/usageStatsService";
import { applyBaseline, getBaseline } from "../services/usageBaseline";
import { isSuperAdmin } from "../services/authService";

/*
  UsageStatsPage (/admin/usage) — נתוני השימוש של המנהלת: כמה נרשמו, כמה
  השלימו את ההגדרה וכמה נעצרו באמצע — בצד הוועד ובצד הספקים. מיועד להחלטות
  מוצר ("איפה אנשים נוטשים"), ולכן מציג מספרים מצטברים בלבד — בלי שמות.

  הנתונים מגיעים אך ורק מהשרת (SuperAdmin בלבד); אין נפילה מקומית, כי מספר
  מומצא בדפדפן יטעה בהחלטה עסקית.
*/
function UsageStatsPage() {
  const isAdmin = isSuperAdmin();
  // כפייה על רענון אחרי "איפוס תצוגה" (קו-הבסיס נשמר ב-localStorage ונקרא ברינדור)
  const [, forceRerender] = useState(0);
  const bump = () => forceRerender((n) => n + 1);
  // סינון רשימת המוסדות: הכל / רק שהושלמו / רק שלא הושלמו
  const [instFilter, setInstFilter] = useState("all");
  // מי שאינה מנהלת לא פונה לשרת בכלל — אין טעם בבקשה שתחזור 403
  const fetcher = useCallback(
    () => (isAdmin ? getUsageStats() : Promise.resolve(null)),
    [isAdmin]
  );
  const { data, isLoading, error } = useApi(fetcher);

  if (!isAdmin) {
    return (
      <div className="page">
        <Card title="נתוני שימוש">
          <p>הדף הזה מיועד למנהלת <BrandName /> בלבד.</p>
        </Card>
      </div>
    );
  }

  // שמות מוסד שמופיעים יותר מפעם אחת ברשימה — לסימון "יתכן כפילות" (רשומה כפולה).
  const instNameCounts = {};
  (data?.institutions || []).forEach((it) => {
    const k = (it.name || "").trim().toLowerCase();
    if (k) instNameCounts[k] = (instNameCounts[k] || 0) + 1;
  });

  return (
    <div className="page">
      <Card
        title={
          <span>
            <Icon name="chart" size={20} /> נתוני שימוש
          </span>
        }
      >
        {isLoading && <Spinner />}
        {!isLoading && error && <ErrorMessage message={error} />}
        {!isLoading && !error && data && (
          <>
            <p
              style={{
                margin: "0 0 16px",
                color: "var(--color-text-muted)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              כמה נרשמו, כמה השלימו את ההגדרה וכמה נעצרו באמצע. מספרים בלבד —
              בלי שמות ובלי פרטים אישיים.
            </p>
            <UsageFunnel
              title="ועדי הורים"
              icon="users"
              funnel={applyBaseline(data.committees, getBaseline("committees"))}
              completedLabel="השלימו את הגדרת הגן"
              stoppedLabel="נרשמו ולא סיימו את האשף"
            />
            <ResetDisplayControl
              funnelKey="committees"
              current={data.committees}
              onChange={bump}
            />
            <p
              style={{
                margin: "0 0 22px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                color: "var(--color-primary-dark)",
              }}
            >
              <Icon name="crown" size={15} /> מתוכם רכשו מסלול פרו:{" "}
              <strong>{data.committees.pro || 0}</strong>
            </p>
            <UsageFunnel
              title="ספקים"
              icon="tag"
              funnel={applyBaseline(data.suppliers, getBaseline("suppliers"))}
              completedLabel="כרטיס מוכן להצגה לוועדים"
              stoppedLabel="נרשמו ולא השלימו את הכרטיס"
            />
            <ResetDisplayControl
              funnelKey="suppliers"
              current={data.suppliers}
              onChange={bump}
            />
            <p
              style={{
                margin: "0 0 22px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                color: "var(--color-primary-dark)",
              }}
            >
              <Icon name="crown" size={15} /> מתוכם רכשו מסלול פרו:{" "}
              <strong>{data.suppliers.pro || 0}</strong>
            </p>
            {/* מקורות הרשמה — כמה נרשמו מכל קוד הפניה (קישור ?ref= של לקוח/שותף) */}
            {data.referrals && data.referrals.length > 0 && (
              <div style={{ margin: "0 0 22px" }}>
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    margin: "0 0 8px",
                    fontWeight: 700,
                    color: "var(--color-primary-dark)",
                  }}
                >
                  <Icon name="link" size={16} /> מקורות הרשמה (קישורי הפניה)
                </p>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {data.referrals.map((r) => (
                    <li
                      key={r.code}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "7px 0",
                        borderBottom: "1px solid var(--color-border)",
                        fontSize: "var(--font-size-sm)",
                      }}
                    >
                      <span style={{ wordBreak: "break-word" }}>{r.code}</span>
                      <strong style={{ whiteSpace: "nowrap" }}>
                        {r.count} {r.count === 1 ? "הרשמה" : "הרשמות"}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* מצב השלמת הגדרה לכל מוסד — למי סיים ומה חסר למי שלא (לליווי לקוחות) */}
            {data.institutions && data.institutions.length > 0 && (
              <div style={{ margin: "0 0 22px" }}>
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    margin: "0 0 4px",
                    fontWeight: 700,
                    color: "var(--color-primary-dark)",
                  }}
                >
                  <Icon name="school" size={16} /> מצב השלמת הגדרה — לפי מוסד
                </p>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  "הושלם" = הוגדרו קטגוריות גבייה <strong>וגם</strong> נוסף לפחות
                  תלמיד אחד.
                </p>
                {/* סינון: הכל / הושלמו / לא הושלמו */}
                <div
                  style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}
                >
                  {[
                    { k: "all", label: "הכל" },
                    { k: "complete", label: "הושלמו" },
                    { k: "incomplete", label: "לא הושלמו" },
                  ].map(({ k, label }) => {
                    const active = instFilter === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setInstFilter(k)}
                        style={{
                          border: `1px solid ${
                            active ? "var(--color-primary-dark)" : "var(--color-border)"
                          }`,
                          background: active
                            ? "var(--color-primary-dark)"
                            : "var(--color-surface)",
                          color: active ? "#fff" : "var(--color-text)",
                          borderRadius: 999,
                          padding: "4px 12px",
                          fontFamily: "var(--font-family)",
                          fontSize: "var(--font-size-sm)",
                          fontWeight: active ? 700 : 600,
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {data.institutions
                    .filter((inst) =>
                      instFilter === "all"
                        ? true
                        : instFilter === "complete"
                        ? inst.complete
                        : !inst.complete
                    )
                    .map((inst, i) => {
                    const missing = [];
                    if (!inst.hasCategories) missing.push("קטגוריות גבייה");
                    if (!inst.hasStudents) missing.push("תלמידים");
                    return (
                      <li
                        key={`${inst.name}-${i}`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "baseline",
                          padding: "7px 0",
                          borderBottom: "1px solid var(--color-border)",
                          fontSize: "var(--font-size-sm)",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            minWidth: 0,
                          }}
                        >
                          <span style={{ fontWeight: 700, wordBreak: "break-word" }}>
                            {inst.name || "(ללא שם)"}
                          </span>
                          {instNameCounts[(inst.name || "").trim().toLowerCase()] > 1 && (
                            <span
                              title="שם מוסד זהה מופיע יותר מפעם אחת. אם המייל זהה — זו כפילות של אותו חשבון; אם שונה — שני חשבונות נפרדים."
                              style={{
                                alignSelf: "flex-start",
                                background: "#fde2ea",
                                color: "#b03060",
                                borderRadius: 999,
                                padding: "1px 8px",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              יתכן כפילות
                            </span>
                          )}
                          {inst.email && (
                            <a
                              href={`mailto:${inst.email}`}
                              style={{
                                color: "var(--color-link)",
                                wordBreak: "break-word",
                              }}
                            >
                              {inst.email}
                            </a>
                          )}
                          {inst.createdAt && (
                            <span style={{ color: "var(--color-text-muted)" }}>
                              נרשם{" "}
                              {new Date(inst.createdAt).toLocaleDateString("he-IL")}
                            </span>
                          )}
                        </span>
                        {inst.complete ? (
                          <strong
                            style={{
                              whiteSpace: "nowrap",
                              color: "var(--color-success)",
                            }}
                          >
                            ✅ הושלם
                          </strong>
                        ) : (
                          <span
                            style={{
                              color: "#d08a2e",
                              fontWeight: 600,
                              textAlign: "start",
                            }}
                          >
                            ⚠️ חסר: {missing.join(", ")}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {/* האם ההגנות שהוגדרו ב-Railway באמת פועלות */}
            <SecurityStatusCard />
            {/* מי משלם ל-VaddyGo ועד מתי — שני ערוצי ההכנסה במקום אחד */}
            <SubscriptionsCard />
            {/* עדכון לכל בעלי המוסדות — יושב ליד תמונת המנויים, כי משם
                מחליטים מה להודיע ולמי. */}
            <BroadcastCard />
            {/* פתיחה/סגירה של פרו למוסד הפעיל (נשמר בשרת) */}
            <ProTestControl />
          </>
        )}
      </Card>
    </div>
  );
}

export default UsageStatsPage;
