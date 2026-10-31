import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import ProjectsPage from "./pages/ProjectsPage";
import TimelinePage from "./pages/TimelinePage";
import RunDetailPage from "./pages/RunDetailPage";
import LoginPage from "./pages/LoginPage";
import { getCurrentUser, logoutUser } from "./api";
import "./App.css";

export default function App() {
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="top-bar">
          <Link to="/" className="brand">
            <span className="brand-dot">●</span> CONTINUUM
          </Link>
          <span className="brand-tagline">Memory that outlives the session</span>

          <div className="user-nav">
            {user ? (
              <div className="user-profile">
                <span className="user-badge">👤 {user.name}</span>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="btn-login-link">Sign In / Register</Link>
            )}
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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
