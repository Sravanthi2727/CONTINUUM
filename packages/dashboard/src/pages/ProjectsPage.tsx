import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProjects } from "../api";

interface Project {
  _id: string;
  name: string;
  repo_url?: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading projects…</div>;

  return (
    <div className="page">
      <h1>Projects</h1>
      {projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects found. Run <code>cnt init</code> in your repo to create one.</p>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map((p) => (
            <div
              key={p._id}
              className="card project-card"
              onClick={() => navigate(`/projects/${p._id}`)}
            >
              <div className="card-title">{p.name}</div>
              {p.repo_url && (
                <div className="card-subtitle">
                  <a href={p.repo_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    {p.repo_url.replace("https://github.com/", "")}
                  </a>
                </div>
              )}
              <div className="card-meta">
                Created {new Date(p.created_at).toLocaleDateString()}
              </div>
              <div className="card-id">ID: {p._id.slice(0, 8)}…</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
