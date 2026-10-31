import { useState } from 'react'
import { postDemoScenario, postEvent, postRun } from '../api/endpoints'
import { USE_DEMO_SCENARIO_API, USE_MOCKS } from '../config'
import { useToast } from './Toast'

function extractServerMessage(body: unknown): string {
  if (!body) return ''
  if (typeof body === 'string') return body
  if (typeof body === 'object') {
    const rec = body as Record<string, unknown>
    const err = rec.error ?? rec.message
    const details = rec.details ? ` (${JSON.stringify(rec.details)})` : ''
    if (err) return `${err}${details}`
    if (rec.details) return JSON.stringify(rec.details)
  }
  return ''
}

interface DemoButtonProps {
  label: string
  description: string
  onClick: () => Promise<void>
  variant?: 'default' | 'danger'
}

function DemoButton({ label, description, onClick, variant = 'default' }: DemoButtonProps) {
  const [busy, setBusy] = useState(false)
  const color = variant === 'danger' ? 'var(--fault)' : 'var(--fossil-dim)'

  const handle = async () => {
    setBusy(true)
    try {
      await onClick()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => { void handle() }}
      disabled={busy}
      title={description}
      className="w-full text-left"
      style={{
        padding: '7px 10px',
        background: 'var(--ink)',
        border: `1px solid ${color}`,
        color: busy ? 'var(--fossil-dim)' : 'var(--fossil)',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-body)',
        cursor: busy ? 'not-allowed' : 'pointer',
        opacity: busy ? 0.6 : 1,
        lineHeight: 1.3,
      }}
    >
      {busy ? 'Running' : label}
    </button>
  )
}

export function DemoControls() {
  const [open, setOpen] = useState(false)
  const { showToast } = useToast()

  const sendDuplicateEvent = async () => {
    const res = await postEvent({
      _id: 'evt_f01_1',
      run_id: 'run_failed_01',
      type: 'command_run',
      step: 1,
      payload: { command: 'npm test' },
      timestamp: new Date().toISOString(),
    })
    const serverMsg = extractServerMessage(res.body)
    if (res.status === 409) {
      showToast({
        type: 'error',
        title: 'Rejected: duplicate event_id (enforced by MongoDB)',
        body: serverMsg
          ? `Duplicate rejected (409): ${serverMsg}`
          : 'Duplicate rejected (409): This event ID already exists, and MongoDB blocked the write.',
      })
    } else if (res.ok) {
      showToast({ type: 'success', title: 'Event accepted', body: 'No duplicate detected (first write).' })
    } else {
      showToast({
        type: 'error',
        title: `Duplicate write failed (${res.status})`,
        body: serverMsg ? `Duplicate rejected (${res.status}): ${serverMsg}` : JSON.stringify(res.body),
      })
    }
  }

  const sendMalformedEvent = async () => {
    const freshId = `evt_demo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const res = await postEvent({
      _id: freshId,
      type: 'command_run',
      payload: { command: 'npm test' },
      timestamp: new Date().toISOString(),
      // Intentionally missing run_id
    })
    const serverMsg = extractServerMessage(res.body)
    if (res.status === 400) {
      showToast({
        type: 'error',
        title: 'Rejected: schema validation failed',
        body: serverMsg
          ? `Validation rejected (400): ${serverMsg}`
          : 'Rejected: schema validation failed (missing run_id).',
      })
    } else if (res.ok) {
      showToast({ type: 'info', title: 'Event accepted', body: 'The server did not reject this payload.' })
    } else {
      showToast({
        type: 'error',
        title: `Validation failed (${res.status})`,
        body: serverMsg ? `Rejected (${res.status}): ${serverMsg}` : JSON.stringify(res.body),
      })
    }
  }

  const startAgentRun = async () => {
    if (USE_MOCKS) {
      const { mockSocket } = await import('../api/mocks/mockSocket')
      const run = mockSocket.triggerDemoRun('agent', 'claude-code')
      showToast({ type: 'info', title: 'New agent run started', body: `Run ${run._id} is live on the timeline.` })
      return
    }
    const freshRunId = `run_agent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const res = await postRun({
      _id: freshRunId,
      project_id: 'proj_alpha',
      source: 'agent',
      agent_name: 'claude-code',
      triggered_by: 'demo_user',
      task_description: 'Live demo agent run, triggered from Demo Controls',
      status: 'running',
      started_at: new Date().toISOString(),
    })
    if (res.ok) {
      showToast({ type: 'success', title: 'New agent run started', body: `Run ${freshRunId} is live on the timeline.` })
    } else {
      const serverMsg = extractServerMessage(res.body)
      showToast({
        type: 'error',
        title: `Failed to start run (${res.status})`,
        body: serverMsg || JSON.stringify(res.body),
      })
    }
  }

  const startHumanRun = async () => {
    if (USE_MOCKS) {
      const { mockSocket } = await import('../api/mocks/mockSocket')
      const run = mockSocket.triggerDemoRun('human')
      showToast({ type: 'info', title: 'New human run started', body: `Run ${run._id} is live on the timeline.` })
      return
    }
    const freshRunId = `run_human_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const res = await postRun({
      _id: freshRunId,
      project_id: 'proj_alpha',
      source: 'human',
      triggered_by: 'demo_user',
      task_description: 'npm test',
      commit_sha: Math.random().toString(16).slice(2, 18),
      status: 'running',
      started_at: new Date().toISOString(),
    })
    if (res.ok) {
      showToast({ type: 'success', title: 'New human run started', body: `Run ${freshRunId} is live on the timeline.` })
    } else {
      const serverMsg = extractServerMessage(res.body)
      showToast({
        type: 'error',
        title: `Failed to start run (${res.status})`,
        body: serverMsg || JSON.stringify(res.body),
      })
    }
  }

  const startDivergingRun = async () => {
    if (USE_MOCKS) {
      const { mockSocket } = await import('../api/mocks/mockSocket')
      mockSocket.triggerDivergingRun()
      showToast({
        type: 'info',
        title: 'Diverging agent run started',
        body: 'It will fail in a few seconds. Open the run to see where it split.',
      })
      return
    }
    if (USE_DEMO_SCENARIO_API) {
      const res = await postDemoScenario('diverging-run')
      if (res.ok) {
        showToast({ type: 'success', title: 'Diverging agent run started', body: 'Watch the verdict flip live.' })
        return
      }
    }
    const freshRunId = `run_diverge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const fallback = await postRun({
      _id: freshRunId,
      project_id: 'proj_alpha',
      source: 'agent',
      agent_name: 'claude-code',
      triggered_by: 'demo_user',
      task_description: 'Refactor change-stream listener to persist resumeTokens',
      status: 'running',
      started_at: new Date().toISOString(),
    })
    if (fallback.ok) {
      showToast({
        type: 'info',
        title: 'Diverging agent run started',
        body: `Run ${freshRunId} is live on timeline. Failure events will update verdict live.`,
      })
    } else {
      const serverMsg = extractServerMessage(fallback.body)
      showToast({
        type: 'error',
        title: `Could not start diverging run (${fallback.status})`,
        body: serverMsg || JSON.stringify(fallback.body),
      })
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 900,
        width: open ? 252 : 'auto',
      }}
    >
      {open && (
        <div
          style={{
            background: 'var(--ink-raised)',
            border: '1px solid rgba(165,150,168,0.25)',
            padding: 'var(--sp-3)',
            marginBottom: 8,
          }}
        >
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', fontWeight: 600, marginBottom: 8 }}>
            Demo controls
          </p>
          <div className="flex flex-col" style={{ gap: 5 }}>
            <DemoButton
              label="Start agent run"
              description="Triggers a new agent run"
              onClick={startAgentRun}
            />
            <DemoButton
              label="Start human run"
              description="Triggers a new human run"
              onClick={startHumanRun}
            />
            <DemoButton
              label="Start diverging agent run"
              description="Triggers a run that fails and shows divergence"
              onClick={startDivergingRun}
            />
            <DemoButton
              label="Send duplicate event"
              description="Sends an event with an already-used id"
              onClick={sendDuplicateEvent}
              variant="danger"
            />
            <DemoButton
              label="Send malformed event"
              description="Sends an event missing run_id"
              onClick={sendMalformedEvent}
              variant="danger"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close demo controls' : 'Open demo controls'}
        className="flex items-center justify-center w-full"
        style={{
          gap: 6,
          padding: '7px 12px',
          background: 'var(--ink-raised)',
          border: '1px solid rgba(165,150,168,0.3)',
          color: 'var(--fossil-dim)',
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <circle cx="2.5" cy="6" r="1.5" fill="var(--lichen)" />
          <circle cx="6" cy="6" r="1.5" fill="var(--saffron)" />
          <circle cx="9.5" cy="6" r="1.5" fill="var(--fault)" />
        </svg>
        {open ? 'Close' : 'Demo'}
      </button>
    </div>
  )
}
