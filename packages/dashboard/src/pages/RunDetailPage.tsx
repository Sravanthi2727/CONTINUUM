import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchRun, fetchEvents, fetchDivergence, fetchSimilarFailures, postEvent } from "../api";
import { getSocket } from "../socket";

interface Run {
  _id: string;
  project_id: string;
  source: "human" | "agent";
  agent_name?: string;
  status: "running" | "success" | "failed";
  started_at: string;
  ended_at?: string;
  task_description?: string;
  commit_sha?: string;
}

interface EventDoc {
  _id: string;
  run_id: string;
  type: string;
  step?: number;
  payload: any;
  error_message?: string;
  timestamp: string;
}

function VerdictBadge({ verdict }: { verdict: string | undefined }) {
  if (!verdict) return null;
  const map: Record<string, string> = {
    safe: "🟢 SAFE",
    risky: "🟡 RISKY",
    blocked: "🔴 BLOCKED",
  };
  const cls: Record<string, string> = {
    safe: "verdict-safe",
    risky: "verdict-risky",
    blocked: "verdict-blocked",
  };
  return (
    <div className={`verdict-badge ${cls[verdict] || ""}`}>
      {map[verdict] || verdict.toUpperCase()}
    </div>
  );
}

function EventRow({ event }: { event: EventDoc }) {
  const [expanded, setExpanded] = useState(false);
  const icon: Record<string, string> = {
    command_run: "⚙️",
    tool_call: "🔧",
    diff_submitted: "📝",
    test_result: "🧪",
    error: "❌",
    plan_step: "📋",
  };
  const isError = event.type === "error" || event.payload?.status === "fail";
  return (
    <div className={`event-row ${isError ? "event-error" : ""}`} onClick={() => setExpanded(!expanded)}>
      <div className="event-icon">{icon[event.type] || "•"}</div>
      <div className="event-info">
        <div className="event-type">
          <span>{event.type}</span>
          {event.step !== undefined && <span className="event-step">step {event.step}</span>}
          {event.payload?.test_name && <code className="event-test">{event.payload.test_name}</code>}
          {event.payload?.status && (
            <span className={`badge ${event.payload.status === "pass" ? "badge-success" : "badge-failed"}`}>
              {event.payload.status}
            </span>
          )}
        </div>
        {event.error_message && (
          <div className="event-error-msg">{event.error_message}</div>
        )}
        {expanded && (
          <pre className="event-payload">{JSON.stringify(event.payload, null, 2)}</pre>
        )}
      </div>
      <div className="event-time">{new Date(event.timestamp).toLocaleTimeString()}</div>
    </div>
  );
}

export default function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [run, setRun] = useState<Run | null>(null);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [divergence, setDivergence] = useState<any>(null);
  const [similarFailures, setSimilarFailures] = useState<any[]>([]);
  const [verdict, setVerdict] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Demo panel state
  const [demoResult, setDemoResult] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (!runId) return;

    Promise.all([fetchRun(runId), fetchEvents(runId)]).then(([runData, eventsData]) => {
      setRun(runData);
      setEvents(eventsData);
      setLoading(false);

      // Compute verdict from events
      const hasError = eventsData.some((e: EventDoc) => e.type === "error" || e.payload?.status === "fail");
      const allPass = eventsData.filter((e: EventDoc) => e.type === "test_result").every((e: EventDoc) => e.payload?.status === "pass");
      if (runData.status === "success" && allPass) setVerdict("safe");
      else if (runData.status === "failed") setVerdict("blocked");
      else if (hasError) setVerdict("risky");

      // Fetch divergence if failed
      if (runData.status === "failed") {
        fetchDivergence(runId).then(setDivergence);

        // Find the first error message for similar failures
        const firstError = eventsData.find((e: EventDoc) => e.error_message);
        if (firstError?.error_message) {
          fetchSimilarFailures(firstError.error_message).then((res) =>
            setSimilarFailures(res.results || [])
          );
        }
      }
    });

    // Live event updates
    const socket = getSocket();
    const handleNewEvent = (event: EventDoc) => {
      if (event.run_id === runId) {
        setEvents((prev) => [...prev, event]);
      }
    };
    socket.on("event:new", handleNewEvent);
    return () => { socket.off("event:new", handleNewEvent); };
  }, [runId]);

  const triggerDuplicateDemo = async () => {
    if (!events[0]) return;
    setDemoLoading(true);
    const result = await postEvent({
      _id: events[0]._id, // duplicate ID
      run_id: runId,
      type: "command_run",
      payload: { command: "this is a duplicate" },
    });
    setDemoResult(
      result.status === 409
        ? `✅ DEMO: Duplicate rejected as expected → ${result.data.code}`
        : `⚠️ Unexpected status ${result.status}: ${JSON.stringify(result.data)}`
    );
    setDemoLoading(false);
  };

  const triggerMalformedDemo = async () => {
    setDemoLoading(true);
    const result = await postEvent({
      // Missing _id (event_id) and type — should fail validation
      run_id: runId,
      payload: { broken: true },
    } as any);
    setDemoResult(
      result.status === 400 || result.status === 422
        ? `✅ DEMO: Malformed event rejected → ${result.data.code || result.data.error}`
        : `⚠️ Unexpected status ${result.status}: ${JSON.stringify(result.data)}`
    );
    setDemoLoading(false);
  };

  if (loading) return <div className="loading">Loading run…</div>;
  if (!run) return <div className="error-state">Run not found.</div>;

  const duration = run.ended_at
    ? Math.round((new Date(run.ended_at).getTime() - new Date(run.started_at).getTime()) / 1000)
    : null;

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate(`/projects/${run.project_id}`)}>
          ← Timeline
        </button>
        <h1>Run Detail</h1>
      </div>

      {/* Run meta */}
      <div className="run-meta-card">
        <div className="run-meta-left">
          <div className="run-id"><code>{run._id}</code></div>
          <div className="run-info">
            <span className={`badge ${run.status === "success" ? "badge-success" : run.status === "failed" ? "badge-failed" : "badge-running"}`}>
              {run.status}
            </span>
            <span className={`badge ${run.source === "agent" ? "badge-agent" : "badge-human"}`}>
              {run.source === "agent" ? `🤖 ${run.agent_name || "agent"}` : "👤 human"}
            </span>
            {run.commit_sha && <code className="commit-sha">{run.commit_sha.slice(0, 7)}</code>}
          </div>
          <div className="run-desc">{run.task_description}</div>
          <div className="run-time">
            {new Date(run.started_at).toLocaleString()}
            {duration !== null && ` · ${duration}s`}
          </div>
        </div>
        <VerdictBadge verdict={verdict} />
      </div>

      {/* Demo failure cases panel */}
      <div className="panel demo-panel">
        <div className="panel-title">🎬 Live Failure Cases Demo</div>
        <div className="demo-buttons">
          <button className="btn btn-danger" onClick={triggerDuplicateDemo} disabled={demoLoading || events.length === 0}>
            Replay Duplicate event_id
          </button>
          <button className="btn btn-warning" onClick={triggerMalformedDemo} disabled={demoLoading}>
            Send Malformed Event (missing fields)
          </button>
        </div>
        {demoResult && <div className="demo-result">{demoResult}</div>}
      </div>

      {/* Events sequence */}
      <div className="panel">
        <div className="panel-title">📊 Event Sequence ({events.length} events)</div>
        {events.length === 0 ? (
          <div className="empty-state">No events recorded for this run.</div>
        ) : (
          <div className="event-list">
            {events.map((e) => <EventRow key={e._id} event={e} />)}
          </div>
        )}
      </div>

      {/* Divergence panel (only for failed runs) */}
      {run.status === "failed" && divergence && (
        <div className="panel divergence-panel">
          <div className="panel-title">🔍 Divergence Analysis</div>
          {divergence.first_mismatch_step !== null ? (
            <>
              <div className="divergence-compared">
                Compared to run: <code>{divergence.compared_to_run_id?.slice(0, 8)}…</code>
              </div>
              <div className="divergence-step">
                <strong>First mismatch at step {divergence.first_mismatch_step}</strong>
              </div>
              <div className="divergence-reason">{divergence.mismatch_details?.reason}</div>
              <div className="divergence-detail">
                <span className="divergence-label">Failed:</span>
                <code>{divergence.mismatch_details?.failed_event_type}</code>
                <span className="divergence-label">vs Success:</span>
                <code>{divergence.mismatch_details?.success_event_type || "—"}</code>
              </div>
            </>
          ) : (
            <div>{divergence.summary}</div>
          )}
        </div>
      )}

      {/* Similar failures panel */}
      {similarFailures.length > 0 && (
        <div className="panel similar-panel">
          <div className="panel-title">🔗 Similar Past Failures</div>
          {similarFailures.map((sf, i) => (
            <div key={i} className="similar-row">
              <div className="similar-score">{(sf.similarity_score * 100).toFixed(0)}% similar</div>
              <div className="similar-error">{sf.error_message}</div>
              <div className="similar-meta">
                {sf.run_info && (
                  <button className="btn-link" onClick={() => navigate(`/runs/${sf.run_id}`)}>
                    View run →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
