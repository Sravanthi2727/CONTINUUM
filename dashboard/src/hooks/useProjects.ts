import { useCallback, useEffect, useState } from 'react'
import { fetchProjects } from '../api/endpoints'
import type { Project } from '../types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchProjects()
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load projects')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { projects, loading, error, reload: load }
}
