import { useState } from "react";
import Button from "./Button";
import Input from "./Input";
import Select from "./Select";
import ConfirmDialog from "./ConfirmDialog";
import WhatsAppIcon from "./WhatsAppIcon";
import {
  ROLES,
  roleLabel,
  getTeam,
  addTeamMember,
  removeTeamMember,
  updateTeamMember,
} from "../services/teamService";
import { whatsappUrlWithText } from "../services/whatsapp";
import "../styles/team.css";

/*
  TeamManager — ניהול חברי הוועד וההרשאות: הוספה, עריכת הרשאה, הסרה, ושליחת
  הזמנה בוואטסאפ/מייל. משמש גם באשף ההקמה (TeamSetupPage) וגם בהגדרות, כדי
  שאותה יכולת תהיה זמינה בשני המקומות בלי כפילות קוד. הרשימה נשמרת מקומית.
*/
function inviteText(member) {
  return (
    `הוזמנת לנהל איתי את ועד ההורים ב-VaddyGo כ${roleLabel(member.role)} 🙂\n` +
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

/* קישור וואטסאפ להזמנה; אם הוזן טלפון (ולא מייל) — נפתחת שיחה ישירה עם המספר. */
function whatsappInvite(member) {
  const contact = member.contact || "";
  const phone = contact.includes("@") ? "" : contact;
  return whatsappUrlWithText(phone, inviteText(member));
}

function TeamManager() {
  const [team, setTeam] = useState(getTeam);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState("viewer");
  const [error, setError] = useState("");
  // חבר צוות שממתין לאישור הסרה (null = אין דיאלוג פתוח)
  const [memberToRemove, setMemberToRemove] = useState(null);
  // חבר צוות שההרשאה שלו נמצאת כרגע בעריכה (null = אף אחד)
  const [editingId, setEditingId] = useState(null);

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

  // שינוי הרשאה לחבר צוות קיים — נשמר מיד וסוגר את מצב העריכה
  function changeRole(id, newRole) {
    setTeam(updateTeamMember(id, { role: newRole }));
    setEditingId(null);
  }

  return (
    <>
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
        <Button type="submit">➕ הוספת משתמש</Button>
      </form>

      {team.length > 0 && (
        <ul className="team-list">
          {team.map((m) => (
            <li key={m.id} className="team-list__item">
              <div className="team-list__info">
                <span className="team-list__name">{m.name}</span>
                {editingId === m.id ? (
                  <select
                    className="team-list__role-select"
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value)}
                    aria-label={`שינוי הרשאה ל${m.name}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <button
                    type="button"
                    className="team-list__role team-list__role-edit"
                    onClick={() => setEditingId(m.id)}
                    aria-label={`עריכת הרשאה ל${m.name} (${roleLabel(m.role)})`}
                  >
                    {roleLabel(m.role)} ✏️
                  </button>
                )}
                {m.contact && (
                  <span className="team-list__contact">{m.contact}</span>
                )}
              </div>
              <a
                className="team-list__invite"
                href={whatsappInvite(m)}
                target="_blank"
                rel="noreferrer"
                aria-label={`שליחת הזמנה ל${m.name} בוואטסאפ`}
              >
                <WhatsAppIcon size={16} /> וואטסאפ
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
    </>
  );
}

export default TeamManager;
