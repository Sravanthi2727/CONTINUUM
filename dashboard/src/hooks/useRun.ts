import { useCallback, useEffect, useState } from 'react'
import { fetchDivergence, fetchEvents, fetchFindings, fetchRun, fetchSimilarFailures } from '../api/endpoints'
import type { Divergence, Finding, Run, RunEvent, SimilarFailure } from '../types'

export function useRun(runId: string) {
  const [run, setRun] = useState<Run | null>(null)
  const [events, setEvents] = useState<RunEvent[]>([])
  const [divergence, setDivergence] = useState<Divergence | null>(null)
  const [similarFailures, setSimilarFailures] = useState<SimilarFailure[]>([])
  const [findings, setFindings] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!runId) return
    setLoading(true)
    setError(null)
    Promise.all([
      fetchRun(runId),
      fetchEvents(runId),
      fetchDivergence(runId),
      fetchSimilarFailures(runId),
      fetchFindings(runId),
    ])
      .then(([r, evts, div, similar, fnd]) => {
        setRun(r)
        setEvents(evts)
        setDivergence(div)
        setSimilarFailures(similar)
        setFindings(fnd)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load run')
        setLoading(false)
      })
  }, [runId])

  useEffect(() => {
    load()
  }, [load])

  const refreshAnalysis = useCallback((id: string) => {
    void Promise.all([
      fetchDivergence(id),
      fetchSimilarFailures(id),
      fetchFindings(id),
    ]).then(([div, similar, fnd]) => {
      setDivergence(div)
      setSimilarFailures(similar)
      setFindings(fnd)
    }).catch(() => {
      // keep last known analysis if a live refresh fails
    })
  }, [])

  const updateRun = useCallback((updated: Run) => {
    if (updated._id !== runId) return
    setRun(prev => {
      if (updated.status === 'failed' && prev?.status !== 'failed') {
        window.setTimeout(() => refreshAnalysis(runId), 120)
      }
      return updated
    })
  }, [runId, refreshAnalysis])

  const addEvent = useCallback((evt: RunEvent) => {
    if (evt.run_id !== runId) return
    setEvents(prev => {
      if (prev.some(e => e._id === evt._id)) return prev
      return [...prev, evt].sort((a, b) => (a.step ?? 0) - (b.step ?? 0))
    })
  }, [runId])

  return { run, events, divergence, similarFailures, findings, loading, error, reload: load, updateRun, addEvent }
}
