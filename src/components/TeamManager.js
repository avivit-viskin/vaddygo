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
  TeamManager — ניהול הגישות וההרשאות מול השרת (API אמיתי). מנהל יוצר הזמנה עם
  טוקן, שולח קישור בוואטסאפ/העתקה, והמוזמן מצטרף בעמוד /join. רשימת ה"גישות"
  מאוחדת: בקשות שנשלחו (⏳ טרם אושר) וחברים שכבר אושרו (✓ אושר) — באותה שורה,
  כך שההזמנה לא "נעלמת" אלא רק משנה סטטוס. האכיפה עצמה בשרת (צופה = בלי עריכה).
*/
function inviteMessage(link, role) {
  return (
    `הוזמנת לנהל איתי את ועד ההורים ב-VaddyGo כ${roleLabel(role)} 🙂\n` +
    `לכניסה והצטרפות: ${link}`
  );
}

function TeamManager() {
  const [team, setTeam] = useState({ accesses: [], canManage: true });
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("viewer");
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  // הפריט שממתין לאישור הסרה/ביטול (null = אין דיאלוג)
  const [toRemove, setToRemove] = useState(null);
  // מזהה החבר שההרשאה שלו נערכת כרגע (null = אף אחד)
  const [editingMemberId, setEditingMemberId] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getTeam();
      setTeam({
        accesses: data.accesses || [],
        canManage: Boolean(data.canManage),
      });
    } catch {
      // בדרך כלל כשעדיין אין גן פעיל בשרת (למשל באמצע ההקמה) — לא שגיאה אמיתית
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
    const t = toRemove;
    setToRemove(null);
    if (t.invite) {
      await cancelInvite(t.inviteId);
    } else {
      await removeMember(t.memberId);
    }
    await refresh();
  }

  async function changeRole(memberId, newRole) {
    setEditingMemberId(null);
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

      {/* רשימת הגישות המאוחדת — בקשות ממתינות וחברים שאושרו, באותה רשימה */}
      {team.accesses.length > 0 && (
        <div className="team-section">
          <h3 className="team-section__title">גישות</h3>
          <ul className="team-list">
            {team.accesses.map((a, idx) => {
              const editable = a.approved && canManage && a.memberId != null;
              return (
                <li
                  key={a.approved ? `m-${a.memberId ?? idx}` : `inv-${a.inviteId}`}
                  className="team-list__item"
                >
                  <div className="team-list__info">
                    <span className="team-list__name">{a.name}</span>
                    <span className="team-list__role">
                      {editable && editingMemberId === a.memberId ? (
                        <select
                          className="team-list__role-select"
                          value={a.role}
                          onChange={(e) => changeRole(a.memberId, e.target.value)}
                          aria-label={`שינוי הרשאה ל${a.name}`}
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      ) : editable ? (
                        <button
                          type="button"
                          className="team-list__role team-list__role-edit"
                          onClick={() => setEditingMemberId(a.memberId)}
                          aria-label={`עריכת הרשאה ל${a.name} (${roleLabel(a.role)})`}
                        >
                          {roleLabel(a.role)} ✏️
                        </button>
                      ) : (
                        <span className="team-list__role">{roleLabel(a.role)}</span>
                      )}
                      {a.approved ? (
                        <span className="team-status team-status--approved">
                          ✓ אושר
                        </span>
                      ) : (
                        <span className="team-status team-status--pending">
                          ⏳ טרם אושר
                        </span>
                      )}
                    </span>
                  </div>

                  {/* ממתין — שיתוף/העתקה/ביטול */}
                  {!a.approved && (
                    <>
                      <a
                        className="team-list__invite"
                        href={whatsappUrlWithText("", inviteMessage(inviteLink(a.token), a.role))}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`שליחת ההזמנה ל${a.name} בוואטסאפ`}
                      >
                        <WhatsAppIcon size={16} /> וואטסאפ
                      </a>
                      <button
                        type="button"
                        className="team-list__invite"
                        onClick={() => copyLink(a.token)}
                        aria-label="העתקת קישור ההזמנה"
                      >
                        העתקת קישור 🔗
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          className="team-list__remove"
                          aria-label={`ביטול ההזמנה ל${a.name}`}
                          onClick={() =>
                            setToRemove({ invite: true, inviteId: a.inviteId, name: a.name })
                          }
                        >
                          ✕
                        </button>
                      )}
                    </>
                  )}

                  {/* אושר — הסרת הגישה של החבר */}
                  {a.approved && canManage && a.memberId != null && (
                    <button
                      type="button"
                      className="team-list__remove"
                      aria-label={`הסרת הגישה של ${a.name}`}
                      onClick={() =>
                        setToRemove({ invite: false, memberId: a.memberId, name: a.name })
                      }
                    >
                      ✕
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!loading && !canManage && team.accesses.length === 0 && (
        <p className="team-page__subtitle">
          רק מנהל/ת יכול/ה להזמין או להסיר גישות.
        </p>
      )}

      <ConfirmDialog
        isOpen={toRemove !== null}
        title={toRemove?.invite ? "ביטול הזמנה" : "הסרת גישה"}
        message={
          toRemove
            ? toRemove.invite
              ? `לבטל את ההזמנה ל${toRemove.name || "משתמש"}?`
              : `להסיר את הגישה של ${toRemove.name}? הגישה שלו/ה לגן תיפסק.`
            : ""
        }
        confirmLabel={toRemove?.invite ? "כן, לבטל" : "כן, להסיר"}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </>
  );
}

export default TeamManager;
