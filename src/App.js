import { Routes, Route, Navigate } from "react-router-dom";
import BrandName from "./components/BrandName";
import BottomNav from "./components/BottomNav";
import HomePage from "./pages/HomePage";
import StudentsPage from "./pages/StudentsPage";
import CalendarPage from "./pages/CalendarPage";
import GiftsPage from "./pages/GiftsPage";
import FilesPage from "./pages/FilesPage";

/*
  App — שלד האפליקציה: כותרת עליונה, אזור התוכן לפי הנתיב, וניווט תחתון קבוע.
*/
function App() {
  return (
    <div dir="rtl">
      <header className="app-header">
        <h1>
          <BrandName withHeart />
        </h1>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/gifts" element={<GiftsPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default App;
