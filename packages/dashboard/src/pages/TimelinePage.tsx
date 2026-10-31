import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchRuns } from "../api";
import { getSocket } from "../socket";

interface Run {
  _id: string;
  project_id: string;
  source: "human" | "agent";
  agent_name?: string;
  triggered_by: string;
  commit_sha?: string;
  task_description?: string;
  status: "running" | "success" | "failed";
  started_at: string;
  ended_at?: string;
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "success" ? "badge-success" : status === "failed" ? "badge-failed" : "badge-running";
  const label = status === "success" ? "✅ success" : status === "failed" ? "❌ failed" : "🔄 running";
  return <span className={`badge ${cls}`}>{label}</span>;
}

function SourceBadge({ source, agentName }: { source: string; agentName?: string }) {
  return source === "agent"
    ? <span className="badge badge-agent">🤖 {agentName || "agent"}</span>
    : <span className="badge badge-human">👤 human</span>;
}

export default function TimelinePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [runs, setRuns] = useState<Run[]>([]);
  const [filter, setFilter] = useState<"all" | "human" | "agent">("all");
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);
  const navigate = useNavigate();

  const loadRuns = useCallback(() => {
    if (!projectId) return;
    fetchRuns(projectId).then((data) => {
      setRuns(data);
      setLoading(false);
    });
  }, [projectId]);

  useEffect(() => {
    loadRuns();

    // Live updates via socket.io
    const socket = getSocket();
    const handleNewRun = (run: Run) => {
      if (run.project_id === projectId) {
        setRuns((prev) => [run, ...prev]);
        setLiveCount((c) => c + 1);
      }
    };
    const handleRunUpdated = (run: Run) => {
      if (run.project_id === projectId) {
        setRuns((prev) => prev.map((r) => (r._id === run._id ? run : r)));
      }
    };
    socket.on("run:new", handleNewRun);
    socket.on("run:updated", handleRunUpdated);

    return () => {
      socket.off("run:new", handleNewRun);
      socket.off("run:updated", handleRunUpdated);
    };
  }, [projectId, loadRuns]);

  const filtered = filter === "all" ? runs : runs.filter((r) => r.source === filter);

  if (loading) return <div className="loading">Loading runs…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate("/")}>← Projects</button>
        <h1>Run Timeline</h1>
        {liveCount > 0 && (
          <span className="live-badge">🔴 Live — {liveCount} update{liveCount > 1 ? "s" : ""}</span>
        )}
      </div>

      <div className="filter-bar">
        {(["all", "human", "agent"] as const).map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "human" ? "👤 Human" : "🤖 Agent"}
          </button>
        ))}
        <span className="run-count">{filtered.length} runs</span>
      </div>

      <div className="timeline">
        {filtered.length === 0 ? (
          <div className="empty-state">No runs match this filter.</div>
        ) : (
          filtered.map((run) => (
            <div
              key={run._id}
              className={`timeline-row ${run.status}`}
              onClick={() => navigate(`/runs/${run._id}`)}
            >
              <div className="timeline-indicator">
                <div className={`dot dot-${run.status}`} />
                <div className="dot-line" />
              </div>
              <div className="timeline-card">
                <div className="timeline-top">
                  <StatusBadge status={run.status} />
                  <SourceBadge source={run.source} agentName={run.agent_name} />
                  {run.commit_sha && (
                    <code className="commit-sha">{run.commit_sha.slice(0, 7)}</code>
                  )}
                </div>
                <div className="timeline-desc">{run.task_description || "—"}</div>
                <div className="timeline-meta">
                  {new Date(run.started_at).toLocaleString()}
                  {run.ended_at && ` · ${Math.round((new Date(run.ended_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
