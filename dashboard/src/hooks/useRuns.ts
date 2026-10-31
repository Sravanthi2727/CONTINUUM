import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchRuns, type RunFilters } from '../api/endpoints'
import type { Run } from '../types'

function matchesFilters(run: Run, filters?: RunFilters): boolean {
  if (filters?.source && run.source !== filters.source) return false
  if (filters?.status && run.status !== filters.status) return false
  return true
}

export function useRuns(projectId: string, filters?: RunFilters) {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const knownIds = useRef<Set<string>>(new Set())

  const filterKey = JSON.stringify(filters)

  const load = useCallback(() => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    fetchRuns(projectId, filters)
      .then(data => {
        knownIds.current = new Set(data.map(r => r._id))
        setRuns(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load runs')
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, filterKey])

  useEffect(() => {
    load()
  }, [load])

  const upsertRun = useCallback((incoming: Run): boolean => {
    if (incoming.project_id !== projectId) return false
    const isNew = !knownIds.current.has(incoming._id)
    knownIds.current.add(incoming._id)

    setRuns(prev => {
      const idx = prev.findIndex(r => r._id === incoming._id)
      if (idx >= 0) {
        if (!matchesFilters(incoming, filters)) {
          return prev.filter(r => r._id !== incoming._id)
        }
        const next = [...prev]
        next[idx] = incoming
        return next
      }
      if (!matchesFilters(incoming, filters)) return prev
      return [incoming, ...prev]
    })

    return isNew && matchesFilters(incoming, filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, filterKey])

  return { runs, loading, error, reload: load, upsertRun }
}
