import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandName from "../components/BrandName";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import {
  ROLES,
  roleLabel,
  getTeam,
  addTeamMember,
  removeTeamMember,
} from "../services/teamService";
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

function TeamSetupPage() {
  const navigate = useNavigate();
  const [team, setTeam] = useState(getTeam);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState("viewer");
  const [error, setError] = useState("");

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

  function handleRemove(id) {
    setTeam(removeTeamMember(id));
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
                שליחת הזמנה 💬
              </a>
              <button
                type="button"
                className="team-list__remove"
                aria-label={`הסרת ${m.name}`}
                onClick={() => handleRemove(m.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="team-page__actions">
        <Button onClick={() => navigate("/")}>כניסה לאפליקציה</Button>
      </div>
    </div>
  );
}

export default TeamSetupPage;
