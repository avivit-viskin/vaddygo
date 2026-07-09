import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import useApi from "../hooks/useApi";
import {
  getFolders,
  addFolder,
  updateFolder,
  deleteFolder,
} from "../services/filesService";
import FolderForm from "./files/FolderForm";
import "../styles/files.css";

/*
  FilesPage — קבצי הוועד (UI_SPEC ס' 13): קישורים לתיקיות Google Drive.
  המשתמשת מדביקה קישור שיתוף של תיקייה עם שם; לחיצה פותחת אותה בדרייב.
  גישה פשוטה בלי OAuth — עובדת כבר עכשיו.
*/
function FilesPage() {
  const { data: folders, isLoading, error, reload } = useApi(getFolders);
  const [editing, setEditing] = useState(null); // null=סגור, {}=חדש, folder=עריכה
  const [deleting, setDeleting] = useState(null);

  async function handleSave(values) {
    if (editing?.id) {
      await updateFolder(editing.id, values);
    } else {
      await addFolder(values);
    }
    setEditing(null);
    reload();
  }

  async function handleDelete() {
    await deleteFolder(deleting.id);
    setDeleting(null);
    reload();
  }

  return (
    <div className="files">
      <Card title="קבצים ותיקיות 📁">
        <p className="files__hint">
          פותחים תיקייה ב-Google Drive, מעתיקים את קישור השיתוף שלה, ומדביקים
          אותו כאן עם שם. לחיצה על התיקייה תפתח אותה בדרייב.
        </p>

        {isLoading && <Spinner />}
        {!isLoading && error && <ErrorMessage message={error} onRetry={reload} />}

        {!isLoading && !error && folders.length === 0 && (
          <EmptyState icon="🗂️" message="עדיין אין תיקיות — נוסיף את הראשונה?" />
        )}

        {!isLoading && !error && folders.length > 0 && (
          <ul className="folders">
            {folders.map((folder) => (
              <li key={folder.id} className="folders__item">
                <a
                  className="folders__link"
                  href={folder.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  📂 {folder.name}
                </a>
                <div className="folders__actions">
                  <button
                    type="button"
                    className="folders__action"
                    aria-label={`עריכת ${folder.name}`}
                    onClick={() => setEditing(folder)}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="folders__action"
                    aria-label={`מחיקת ${folder.name}`}
                    onClick={() => setDeleting(folder)}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Button variant="secondary" onClick={() => setEditing({})}>
          + הוספת תיקייה
        </Button>
      </Card>

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "עריכת תיקייה" : "הוספת תיקייה"}
      >
        {editing !== null && (
          <FolderForm
            folder={editing?.id ? editing : null}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleting !== null}
        title="מחיקת תיקייה"
        message={
          deleting ? `למחוק את הקישור "${deleting.name}"? אפשר להוסיף שוב בכל עת.` : ""
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

export default FilesPage;
