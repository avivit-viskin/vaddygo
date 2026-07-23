import { useState, useEffect, useCallback } from "react";
import Button from "./Button";
import Input from "./Input";
import Select from "./Select";
import Spinner from "./Spinner";
import ConfirmDialog from "./ConfirmDialog";
import WhatsAppIcon from "./WhatsAppIcon";
import {
  ROLES,
  roleLabel,
  getTeam,
  createInvite,
  cancelInvite,
  removeMember,
  updateMemberRole,
  inviteLink,
} from "../services/teamService";
import { whatsappUrlWithText } from "../services/whatsapp";
import { toastSuccess } from "../services/toastBus";
import "../styles/team.css";

/*
  TeamManager — ניהול חברי הצוות וההרשאות מול השרת (API אמיתי). מנהל יוצר
  הזמנה עם טוקן, שולח את הקישור בוואטסאפ/העתקה, והמוזמן מצטרף בעמוד /join.
  משמש גם באשף ההקמה וגם בהגדרות. האכיפה עצמה בשרת (צופה = בלי עריכה).
*/
function inviteMessage(link, role) {
  return (
    `הוזמנת לנהל איתי את ועד ההורים ב-VaddyGo כ${roleLabel(role)} 🙂\n` +
    `לכניסה והצטרפות: ${link}`
  );
}

function TeamManager() {
  const [team, setTeam] = useState({
    members: [],
    pendingInvites: [],
    canManage: true,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("viewer");
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getTeam();
      setTeam({
        members: data.members || [],
        pendingInvites: data.pendingInvites || [],
        canManage: Boolean(data.canManage),
      });
      setLoadError("");
    } catch {
      // בדרך כלל כשעדיין אין גן פעיל בשרת (למשל באמצע ההקמה) — לא שגיאה אמיתית
      setLoadError("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCreate(event) {
    event.preventDefault();
    if (!name.trim()) {
      setFormError("צריך למלא שם");
      return;
    }
    setFormError("");
    setCreating(true);
    try {
      const invite = await createInvite(role, name.trim());
      const link = inviteLink(invite.token);
      // פתיחת וואטסאפ עם הקישור האמיתי (אם הוזן טלפון — ישירות למספר)
      const target = phone.includes("@") ? "" : phone;
      window.open(
        whatsappUrlWithText(target, inviteMessage(link, invite.role)),
        "_blank"
      );
      setName("");
      setPhone("");
      setRole("viewer");
      await refresh();
    } catch (err) {
      setFormError(err.message || "לא הצלחנו ליצור הזמנה");
    } finally {
      setCreating(false);
    }
  }

  async function copyLink(token) {
    try {
      await navigator.clipboard.writeText(inviteLink(token));
      toastSuccess("הקישור הועתק ✓");
    } catch {
      // חלק מהדפדפנים חוסמים clipboard — הקישור עדיין זמין בכפתור הוואטסאפ
    }
  }

  async function confirmRemove() {
    const m = memberToRemove;
    setMemberToRemove(null);
    if (m.__invite) {
      await cancelInvite(m.id);
    } else {
      await removeMember(m.id);
    }
    await refresh();
  }

  async function changeRole(memberId, newRole) {
    setEditingId(null);
    await updateMemberRole(memberId, newRole);
    await refresh();
  }

  const canManage = team.canManage;

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

      {canManage && (
        <form className="team-invite" onSubmit={handleCreate} noValidate>
          <Input
            id="team-name"
            label="שם"
            placeholder="למשל: מיכל כהן"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={formError}
          />
          <Input
            id="team-phone"
            label="טלפון לוואטסאפ (לא חובה)"
            placeholder="050-1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
          <Button type="submit" isLoading={creating}>
            ➕ יצירת הזמנה ושליחה
          </Button>
        </form>
      )}

      {loading && <Spinner />}

      {/* הזמנות שממתינות לפדיון — עם קישור לשיתוף וכפתור ביטול (למנהל) */}
      {team.pendingInvites.length > 0 && (
        <div className="team-section">
          <h3 className="team-section__title">הזמנות שנשלחו וממתינות</h3>
          <ul className="team-list">
            {team.pendingInvites.map((inv) => (
              <li key={`inv-${inv.id}`} className="team-list__item">
                <div className="team-list__info">
                  <span className="team-list__name">
                    {inv.inviteeName || "משתמש שהוזמן"}
                  </span>
                  <span className="team-list__role">
                    {roleLabel(inv.role)}
                    <span className="team-status team-status--pending">
                      ⏳ טרם אושר
                    </span>
                  </span>
                </div>
                <a
                  className="team-list__invite"
                  href={whatsappUrlWithText("", inviteMessage(inviteLink(inv.token), inv.role))}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`שליחת ההזמנה ל${inv.inviteeName || ""} בוואטסאפ`}
                >
                  <WhatsAppIcon size={16} /> וואטסאפ
                </a>
                <button
                  type="button"
                  className="team-list__invite"
                  onClick={() => copyLink(inv.token)}
                  aria-label="העתקת קישור ההזמנה"
                >
                  העתקת קישור 🔗
                </button>
                {canManage && (
                  <button
                    type="button"
                    className="team-list__remove"
                    aria-label={`ביטול ההזמנה ל${inv.inviteeName || ""}`}
                    onClick={() => setMemberToRemove({ ...inv, __invite: true })}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* חברי הצוות שכבר הצטרפו */}
      {team.members.length > 0 && (
        <div className="team-section">
          <h3 className="team-section__title">חברי הצוות</h3>
          <ul className="team-list">
            {team.members.map((m) => (
              <li key={`m-${m.id}`} className="team-list__item">
                <div className="team-list__info">
                  <span className="team-list__name">
                    {m.username}
                    <span className="team-status team-status--approved">
                      ✓ אושר
                    </span>
                  </span>
                  {canManage && editingId === m.id ? (
                    <select
                      className="team-list__role-select"
                      value={m.role}
                      onChange={(e) => changeRole(m.id, e.target.value)}
                      aria-label={`שינוי הרשאה ל${m.username}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  ) : canManage ? (
                    <button
                      type="button"
                      className="team-list__role team-list__role-edit"
                      onClick={() => setEditingId(m.id)}
                      aria-label={`עריכת הרשאה ל${m.username} (${roleLabel(m.role)})`}
                    >
                      {roleLabel(m.role)} ✏️
                    </button>
                  ) : (
                    <span className="team-list__role">{roleLabel(m.role)}</span>
                  )}
                </div>
                {canManage && (
                  <button
                    type="button"
                    className="team-list__remove"
                    aria-label={`הסרת ${m.username}`}
                    onClick={() => setMemberToRemove(m)}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && !canManage && (
        <p className="team-page__subtitle">
          רק מנהל/ת יכול/ה להזמין או להסיר חברי צוות.
        </p>
      )}

      {loadError && <p className="team-page__subtitle">{loadError}</p>}

      <ConfirmDialog
        isOpen={memberToRemove !== null}
        title={memberToRemove?.__invite ? "ביטול הזמנה" : "הסרת חבר צוות"}
        message={
          memberToRemove
            ? memberToRemove.__invite
              ? `לבטל את ההזמנה ל${memberToRemove.inviteeName || "משתמש"}?`
              : `להסיר את ${memberToRemove.username} מהצוות? הגישה שלו/ה לגן תיפסק.`
            : ""
        }
        confirmLabel={memberToRemove?.__invite ? "כן, לבטל" : "כן, להסיר"}
        onConfirm={confirmRemove}
        onCancel={() => setMemberToRemove(null)}
      />
    </>
  );
}

export default TeamManager;
