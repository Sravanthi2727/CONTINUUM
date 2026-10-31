import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { DemoControls } from './components/DemoControls'
import { TopBar } from './components/TopBar'
import { useSocket, type ConnectionStatus } from './hooks/useSocket'
import { ProjectsPage } from './pages/ProjectsPage'
import { RunDetailPage } from './pages/RunDetailPage'
import { TimelinePage } from './pages/TimelinePage'
import type { Run, RunEvent } from './types'

type RunHandler = (run: Run) => void
type EventHandler = (evt: RunEvent) => void
type ReconnectHandler = () => void

function dedupeById<T extends { _id: string }>(items: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of items) map.set(item._id, item)
  return [...map.values()]
}

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('reconnecting')
  const runUpsertHandlers = useRef<RunHandler[]>([])
  const runUpdateHandlers = useRef<RunHandler[]>([])
  const eventCreateHandlers = useRef<EventHandler[]>([])
  const reconnectHandlers = useRef<ReconnectHandler[]>([])
  const seenEvtIds = useRef<Set<string>>(new Set())
  const runQueue = useRef<Run[]>([])
  const eventQueue = useRef<RunEvent[]>([])
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushQueues = useCallback(() => {
    const runs = dedupeById(runQueue.current)
    const events = dedupeById(eventQueue.current)
    runQueue.current = []
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

  const handleRunCreated = useCallback((run: Run) => {
    runQueue.current.push(run)
    scheduleFlush()
  }, [scheduleFlush])

  const handleRunUpdated = useCallback((run: Run) => {
    runQueue.current.push(run)
    scheduleFlush()
  }, [scheduleFlush])

  const handleEventCreated = useCallback((evt: RunEvent) => {
    eventQueue.current.push(evt)
    scheduleFlush()
  }, [scheduleFlush])

  const handleReconnect = useCallback(() => {
    reconnectHandlers.current.forEach(h => {
      try {
        h()
      } catch {
        // ignore reconnect handler error
      }
    })
  }, [])

  const { status } = useSocket({
    onRunCreated: handleRunCreated,
    onRunUpdated: handleRunUpdated,
    onEventCreated: handleEventCreated,
    onReconnect: handleReconnect,
  })

  useEffect(() => { setConnectionStatus(status) }, [status])

  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const registerRunUpsert = useCallback((handler: RunHandler) => {
    runUpsertHandlers.current = [handler]
  }, [])

  const registerRunUpdate = useCallback((handler: RunHandler) => {
    runUpdateHandlers.current = [handler]
  }, [])

  const registerEventCreate = useCallback((handler: EventHandler) => {
    eventCreateHandlers.current = [handler]
  }, [])

  const registerReconnect = useCallback((handler: ReconnectHandler) => {
    reconnectHandlers.current = [handler]
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      if (seenEvtIds.current.size > 1000) seenEvtIds.current.clear()
    }, 60_000)
    return () => {
      clearInterval(id)
      if (flushTimer.current) clearTimeout(flushTimer.current)
    }
  }, [])

  return (
    <div className="flex min-h-full flex-col">
      <TopBar connectionStatus={connectionStatus} />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<ProjectsPage onReconnect={registerReconnect} />} />
          <Route
            path="/projects/:projectId"
            element={
              <TimelinePage
                onRunUpsert={registerRunUpsert}
                onReconnect={registerReconnect}
              />
            }
          />
          <Route
            path="/runs/:runId"
            element={
              <RunDetailPage
                onRunUpdate={registerRunUpdate}
                onEventCreate={registerEventCreate}
                onReconnect={registerReconnect}
              />
            }
          />
          <Route
            path="*"
            element={
              <div style={{ padding: 'var(--sp-12)', textAlign: 'center' }}>
                <p
                  className="font-display"
                  style={{ fontWeight: 700, fontSize: 'var(--text-2xl)', color: 'var(--fossil)' }}
                >
                  Layer not found
                </p>
                <Link to="/" style={{ fontSize: 'var(--text-sm)', color: 'var(--fossil-dim)', marginTop: 12, display: 'block' }}>
                  Back to projects
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
