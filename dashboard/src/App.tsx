import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { DemoControls } from './components/DemoControls'
import { TopBar } from './components/TopBar'
import { useSocket, type ConnectionStatus } from './hooks/useSocket'
import { DocsPage } from './pages/DocsPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { RunDetailPage } from './pages/RunDetailPage'
import { TimelinePage } from './pages/TimelinePage'
import type { Run, RunEvent } from './types'

type RunHandler   = (run: Run)       => void
type EventHandler = (evt: RunEvent)  => void

function dedupeById<T extends { _id: string }>(items: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of items) map.set(item._id, item)
  return [...map.values()]
}

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('reconnecting')

  const runUpsertHandlers  = useRef<RunHandler[]>([])
  const runUpdateHandlers  = useRef<RunHandler[]>([])
  const eventCreateHandlers = useRef<EventHandler[]>([])
  const seenEvtIds = useRef<Set<string>>(new Set())

  // ── Batched flush (80 ms window) so rapid socket bursts don't thrash React ──
  const runQueue   = useRef<Run[]>([])
  const eventQueue = useRef<RunEvent[]>([])
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushQueues = useCallback(() => {
    const runs   = dedupeById(runQueue.current)
    const events = dedupeById(eventQueue.current)
    runQueue.current   = []
    eventQueue.current = []
    for (const run of runs) {
      runUpsertHandlers.current.forEach(h => h(run))
      runUpdateHandlers.current.forEach(h => h(run))
    }
    for (const evt of events) {
      if (seenEvtIds.current.has(evt._id)) continue
      seenEvtIds.current.add(evt._id)
      eventCreateHandlers.current.forEach(h => h(evt))
    }
  }, [])

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) return
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null
      flushQueues()
    }, 80)
  }, [flushQueues])

  const handleRunCreated   = useCallback((run: Run)      => { runQueue.current.push(run);   scheduleFlush() }, [scheduleFlush])
  const handleRunUpdated   = useCallback((run: Run)      => { runQueue.current.push(run);   scheduleFlush() }, [scheduleFlush])
  const handleEventCreated = useCallback((evt: RunEvent) => { eventQueue.current.push(evt); scheduleFlush() }, [scheduleFlush])

  const { status } = useSocket({
    onRunCreated:   handleRunCreated,
    onRunUpdated:   handleRunUpdated,
    onEventCreated: handleEventCreated,
  })

  useEffect(() => { setConnectionStatus(status) }, [status])

  // Relative timestamps tick every 30s
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  // Page-level handler registration (one page active at a time)
  const registerRunUpsert   = useCallback((h: RunHandler)   => { runUpsertHandlers.current   = [h] }, [])
  const registerRunUpdate   = useCallback((h: RunHandler)   => { runUpdateHandlers.current   = [h] }, [])
  const registerEventCreate = useCallback((h: EventHandler) => { eventCreateHandlers.current = [h] }, [])

  // Periodic cleanup of seen IDs
  useEffect(() => {
    const id = setInterval(() => {
      if (seenEvtIds.current.size > 1000) seenEvtIds.current.clear()
    }, 60_000)
    return () => {
      clearInterval(id)
      if (flushTimer.current) clearTimeout(flushTimer.current)
    }
  }, [])

  const { pathname } = useLocation()
  const isHomePage = pathname === '/'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isHomePage && <TopBar connectionStatus={connectionStatus} />}

      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/"                    element={<HomePage connectionStatus={connectionStatus} />} />
          <Route path="/docs"                element={<DocsPage />} />
          <Route path="/documentation"       element={<DocsPage />} />
          <Route path="/login"               element={<LoginPage />} />
          <Route path="/projects"            element={<ProjectsPage />} />
          <Route
            path="/projects/:projectId"
            element={<TimelinePage onRunUpsert={registerRunUpsert} />}
          />
          <Route
            path="/runs/:runId"
            element={
              <RunDetailPage
                onRunUpdate={registerRunUpdate}
                onEventCreate={registerEventCreate}
              />
            }
          />
          <Route
            path="*"
            element={
              <div style={{ padding: 'var(--sp-12)', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-2xl)', color: 'var(--fossil)' }}>
                  404 — Layer not found
                </p>
                <Link to="/" style={{ fontSize: 'var(--text-sm)', color: 'var(--fossil-dim)', marginTop: 12, display: 'block' }}>
                  Back to home
                </Link>
              </div>
            }
          />
        </Routes>
      </div>

      <DemoControls />
    </div>
  )
}
