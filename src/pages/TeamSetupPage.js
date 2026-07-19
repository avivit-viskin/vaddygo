import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  ROLES,
  roleLabel,
  getTeam,
  addTeamMember,
  removeTeamMember,
} from "../services/teamService";
import {
  getInstitutions,
  addInstitution,
} from "../services/institutionsService";
import { whatsappShareUrl } from "../services/whatsapp";
import "../styles/team.css";

/*
  TeamSetupPage — מסך ניהול המשתמשים וההרשאות (משימה 6), מוצג אחרי אשף
  הגדרת הגן. אפשר להזמין חברות ועד נוספות, לתת לכל אחת הרשאה (צופה/עורך/מנהל)
  ולשלוח הזמנה בוואטסאפ. שלב "מסכים בלבד" — הרשימה נשמרת מקומית.
*/
function inviteText(member) {
  return (
    `הוזמנת לנהל איתי את ועד ההורים ב-VaddyGo כ${roleLabel(member.role)} 💜\n` +
    `לכניסה: https://vaddygo-production.up.railway.app/welcome`
  );
}

/* קישור מייל עם הזמנה מוכנה; אם ה"פרטי קשר" הוא מייל — הוא ממולא כנמען. */
function mailtoInvite(member) {
  const to = member.contact.includes("@") ? member.contact : "";
  const subject = "הזמנה לניהול ועד ההורים ב-VaddyGo";
  return (
    `mailto:${to}?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(inviteText(member))}`
  );
}

function TeamSetupPage() {
  const navigate = useNavigate();
  const [team, setTeam] = useState(getTeam);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState("viewer");
  const [error, setError] = useState("");
  // חבר צוות שממתין לאישור הסרה (null = אין דיאלוג פתוח)
  const [memberToRemove, setMemberToRemove] = useState(null);

  // שאלת "כמה ועדים" (הועברה מהאשף) — רלוונטית רק בהקמה הראשונה, כשקיים רק
  // המוסד הראשי. בהוספת מוסד נוסף כבר לא שואלים שוב.
  const [isFirstSetup] = useState(() => getInstitutions().length <= 1);
  const [extraCount, setExtraCount] = useState(0);
  const [extraNames, setExtraNames] = useState([]);

  function setCount(count) {
    const names = [...extraNames];
    names.length = count;
    setExtraCount(count);
    setExtraNames(names);
  }

  function handleAdd(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("צריך למלא שם");
      return;
    }
    addTeamMember({ name, contact, role });
    setTeam(getTeam());
    setName("");
    setContact("");
    setRole("viewer");
    setError("");
  }

  function confirmRemove() {
    setTeam(removeTeamMember(memberToRemove.id));
    setMemberToRemove(null);
  }

  // סיום ההקמה: יוצר את הוועדים הנוספים ששמותיהם הוזנו (מוסדות להפעלה מאוחר
  // יותר), ואז נכנס לאפליקציה. משמש גם ל"כניסה" וגם ל"אעשה זאת מאוחר יותר".
  function finish() {
    extraNames
      .filter((n) => n && n.trim())
      .forEach((n) => addInstitution(n));
    navigate("/");
  }

  return (
    <div className="team-page">
      <h1 className="team-page__logo">
        <BrandName withHeart />
      </h1>
      <h2 className="team-page__title">מי עוד מנהל איתך את הוועד? 👥</h2>
      <p className="team-page__subtitle">
        אפשר להזמין חברות ועד נוספות ולתת לכל אחת הרשאה מתאימה. תמיד אפשר להוסיף
        או לשנות גם אחר כך.
      </p>

      <ul className="roles-legend">
        {ROLES.map((r) => (
          <li key={r.value} className="roles-legend__item">
            <span className="roles-legend__icon" aria-hidden="true">
              {r.icon}
            </span>
            <span>
              <strong>{r.label}</strong> — {r.desc}
            </span>
          </li>
        ))}
      </ul>

      <form className="team-invite" onSubmit={handleAdd} noValidate>
        <Input
          id="team-name"
          label="שם"
          placeholder="למשל: מיכל כהן"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
        />
        <Input
          id="team-contact"
          label="מייל או טלפון (לא חובה)"
          placeholder="050-1234567 או name@mail.com"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <Select
          id="team-role"
          label="הרשאה"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          ➕ הוספת משתמש
        </Button>
      </form>

      {team.length > 0 && (
        <ul className="team-list">
          {team.map((m) => (
            <li key={m.id} className="team-list__item">
              <div className="team-list__info">
                <span className="team-list__name">{m.name}</span>
                <span className="team-list__role">{roleLabel(m.role)}</span>
                {m.contact && (
                  <span className="team-list__contact">{m.contact}</span>
                )}
              </div>
              <a
                className="team-list__invite"
                href={whatsappShareUrl(inviteText(m))}
                target="_blank"
                rel="noreferrer"
                aria-label={`שליחת הזמנה ל${m.name} בוואטסאפ`}
              >
                וואטסאפ 💬
              </a>
              <a
                className="team-list__invite"
                href={mailtoInvite(m)}
                aria-label={`שליחת הזמנה ל${m.name} במייל`}
              >
                מייל 📧
              </a>
              <button
                type="button"
                className="team-list__remove"
                aria-label={`הסרת ${m.name}`}
                onClick={() => setMemberToRemove(m)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {isFirstSetup && (
        <section className="team-committees">
          <h2 className="team-page__title">מנהלת עוד ועדים חוץ מזה? 🏫</h2>
          <p className="team-page__subtitle">
            אפשר לנהל כמה ועדים באותו חשבון. הוסיפי אותם עכשיו — או מאוחר יותר
            מהתפריט.
          </p>
          <div className="chips">
            <button
              type="button"
              className={`chip${extraCount === 0 ? " chip--active" : ""}`}
              aria-pressed={extraCount === 0}
              onClick={() => setCount(0)}
            >
              לא, רק זה
            </button>
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                className={`chip${extraCount === n ? " chip--active" : ""}`}
                aria-pressed={extraCount === n}
                onClick={() => setCount(n)}
              >
                {n} נוספים
              </button>
            ))}
          </div>
          {Array.from({ length: extraCount }).map((_, i) => (
            <Input
              key={i}
              id={`extra-committee-${i}`}
              label={`שם הוועד הנוסף ${i + 1}`}
              placeholder="למשל: גן הרימון"
              value={extraNames[i] || ""}
              onChange={(e) => {
                const names = [...extraNames];
                names[i] = e.target.value;
                setExtraNames(names);
              }}
            />
          ))}
        </section>
      )}

      <div className="team-page__actions">
        <Button onClick={finish}>כניסה לאפליקציה</Button>
        <Button variant="secondary" onClick={finish}>
          אעשה זאת מאוחר יותר
        </Button>
      </div>

      <ConfirmDialog
        isOpen={memberToRemove !== null}
        title="הסרת חבר צוות"
        message={
          memberToRemove
            ? `להסיר את ${memberToRemove.name} מרשימת חברי הצוות?`
            : ""
        }
        confirmLabel="כן, להסיר"
        onConfirm={confirmRemove}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  );
}

export default TeamSetupPage;
