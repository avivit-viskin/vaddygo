import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import BrandName from "../components/BrandName";
import Card from "../components/Card";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import { isAuthenticated } from "../services/authService";
import { previewInvite, acceptInvite, roleLabel } from "../services/teamService";
import { syncInstitutionsFromServer } from "../services/onboardingService";
import {
  getInstitutions,
  setActiveInstitution,
  getActiveInstitution,
} from "../services/institutionsService";
import "../styles/onboarding.css";

/*
  JoinPage — עמוד הצטרפות לגן דרך קישור הזמנה (/join/:token).
  - משתמש שאינו מחובר: מוצגת בקשה להתחבר/להירשם, והטוקן נשמר בכתובת (next)
    כדי לחזור לכאן ולהשלים את ההצטרפות.
  - משתמש מחובר: מוצגת תצוגה מקדימה ("הוזמנת ל<גן> כ<הרשאה>"), ובלחיצה הוא
    מצטרף (POST accept), הגן מסונכרן לרשימת המוסדות ונפתח אוטומטית.
*/
function JoinPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const authed = isAuthenticated();
  const next = `/join/${encodeURIComponent(token)}`;
  // שם הגן הפעיל — לכפתור "כניסה למוסד X" כשהקישור כבר נוצל אך יש למשתמש גישה
  const activeName = authed ? getActiveInstitution()?.name : null;

  const [loading, setLoading] = useState(authed);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!authed) {
      return;
    }
    let alive = true;
    previewInvite(token)
      .then((data) => {
        if (alive) {
          setPreview(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err.message || "ההזמנה לא נמצאה או שכבר נוצלה.");
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [token, authed]);

  const handleJoin = useCallback(async () => {
    setJoining(true);
    setError("");
    try {
      const result = await acceptInvite(token);
      await syncInstitutionsFromServer();
      // פתיחת הגן שהצטרפת אליו — לפי מזהה השרת (GanId), עם נפילה להתאמה לפי שם
      const list = getInstitutions().filter((i) => i.serverGroupId != null);
      const joined =
        list.find((i) => i.serverGroupId === result.ganId) ||
        list.find((i) => i.name === result.ganName && i.role === result.role) ||
        list.find((i) => i.name === result.ganName);
      if (joined) {
        setActiveInstitution(joined.id);
      }
      navigate("/");
    } catch (err) {
      setError(err.message || "לא הצלחנו לצרף אותך לגן. אפשר לנסות שוב.");
      setJoining(false);
    }
  }, [token, navigate]);

  return (
    <div className="auth-page">
      <h1 className="auth-page__logo">
        <BrandName withHeart />
      </h1>

      {!authed && (
        <Card title="הוזמנת לנהל ועד ב-VaddyGo 🙂">
          <p className="auth-page__hint">
            כדי להצטרף לגן צריך קודם להתחבר לחשבון שלך (או לפתוח חשבון חדש). מיד
            אחרי זה נחזיר אותך לכאן להשלמת ההצטרפות.
          </p>
          <div className="auth-page__actions">
            <Link to={`/login?next=${encodeURIComponent(next)}`}>
              <Button>כניסה לחשבון קיים</Button>
            </Link>
          </div>
          <p className="auth-page__hint">
            עדיין אין לך חשבון?{" "}
            <Link to={`/register?next=${encodeURIComponent(next)}`}>
              להרשמה מהירה
            </Link>
          </p>
        </Card>
      )}

      {authed && loading && (
        <Card title="רגע, טוענים את ההזמנה…">
          <Spinner />
        </Card>
      )}

      {authed && !loading && error && (
        <Card title="אפשר להיכנס לאפליקציה 🙂">
          <p className="auth-page__hint">
            אין צורך בקישור יותר — כבר יש לך גישה לגן. אפשר פשוט להיכנס
            לאפליקציה.
          </p>
          <div className="auth-page__actions">
            <Link to="/">
              <Button>
                {activeName ? `כניסה למוסד ${activeName}` : "כניסה לאפליקציה"}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* קישור שכבר נוצל על ידי מישהו אחר — אי אפשר להצטרף איתו */}
      {authed && !loading && !error && preview && preview.used && (
        <Card title="הקישור כבר נוצל 🙂">
          <p className="auth-page__hint">
            הקישור הזה כבר נוצל על ידי מישהו אחר. אם צריך גישה — אפשר לבקש
            מהמנהל/ת לשלוח קישור הזמנה חדש.
          </p>
          <div className="auth-page__actions">
            <Link to="/">
              <Button>
                {activeName ? `כניסה למוסד ${activeName}` : "כניסה לאפליקציה"}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* הזמנה תקפה, או שכבר יש גישה (המוזמן/הבעלים פותח שוב) — מציגים את שם הגן */}
      {authed && !loading && !error && preview && !preview.used && (
        <Card
          title={preview.alreadyMember ? "כבר יש לך גישה 🙂" : "הזמנה להצטרפות 🎉"}
        >
          <p className="join-preview">
            {preview.alreadyMember ? "יש לך גישה לגן " : "הוזמנת לנהל את הגן "}
            <strong>{preview.ganName}</strong> בתור{" "}
            <strong>{roleLabel(preview.role)}</strong>.
          </p>
          {preview.role === "viewer" && !preview.alreadyMember && (
            <p className="auth-page__hint">
              כ<strong>צופה</strong> תוכל/י לראות את כל הנתונים של הגן, אך לא
              לערוך אותם.
            </p>
          )}
          {error && <ErrorMessage message={error} />}
          <div className="auth-page__actions">
            <Button onClick={handleJoin} isLoading={joining}>
              {preview.alreadyMember
                ? `כניסה לגן ${preview.ganName}`
                : "הצטרפות לגן"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default JoinPage;
