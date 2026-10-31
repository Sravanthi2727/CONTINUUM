import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProjectsPage from "./pages/ProjectsPage";
import TimelinePage from "./pages/TimelinePage";
import RunDetailPage from "./pages/RunDetailPage";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="top-bar">
          <a href="/" className="brand">
            <span className="brand-dot">●</span> CONTINUUM
          </a>
          <span className="brand-tagline">Memory that outlives the session</span>
        </header>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<TimelinePage />} />
            <Route path="/runs/:runId" element={<RunDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
