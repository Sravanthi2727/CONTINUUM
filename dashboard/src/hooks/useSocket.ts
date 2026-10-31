import { useEffect, useRef, useState } from 'react'
import { normalizeEvent, normalizeRun } from '../api/endpoints'
import { SOCKET_URL, USE_MOCKS } from '../config'
import type { Run, RunEvent } from '../types'

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

interface SocketCallbacks {
  onRunCreated?: (run: Run) => void
  onRunUpdated?: (run: Run) => void
  onEventCreated?: (event: RunEvent) => void
  onReconnect?: () => void
}

export function useSocket(callbacks: SocketCallbacks) {
  const [status, setStatus] = useState<ConnectionStatus>('reconnecting')
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks
  const hasConnectedOnce = useRef(false)

  useEffect(() => {
    let cancelled = false
    let cleanupFn: (() => void) | undefined

    if (USE_MOCKS) {
      void import('../api/mocks/mockSocket').then(({ mockSocket }) => {
        if (cancelled) return
        const onConnect = () => {
          setStatus('connected')
          if (hasConnectedOnce.current) {
            callbacksRef.current.onReconnect?.()
          }
          hasConnectedOnce.current = true
        }
        const onDisconnect = () => setStatus('reconnecting')
        const onRunCreated = (d: unknown) => callbacksRef.current.onRunCreated?.(normalizeRun(d))
        const onRunUpdated = (d: unknown) => callbacksRef.current.onRunUpdated?.(normalizeRun(d))
        const onEventCreated = (d: unknown) => callbacksRef.current.onEventCreated?.(normalizeEvent(d))

        mockSocket.on('connect', onConnect)
        mockSocket.on('disconnect', onDisconnect)
        mockSocket.on('run:created', onRunCreated)
        mockSocket.on('run:updated', onRunUpdated)
        mockSocket.on('event:created', onEventCreated)
        mockSocket.connect()
        setStatus('connected')
        hasConnectedOnce.current = true

        cleanupFn = () => {
          mockSocket.off('connect', onConnect)
          mockSocket.off('disconnect', onDisconnect)
          mockSocket.off('run:created', onRunCreated)
          mockSocket.off('run:updated', onRunUpdated)
          mockSocket.off('event:created', onEventCreated)
          mockSocket.disconnect()
        }
      })
    } else {
      // Real mode: strict Socket.IO client, never fallback to mocks
      void import('socket.io-client').then(({ io }) => {
        if (cancelled) return
        const socket = io(SOCKET_URL, {
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
        })

        socket.on('connect', () => {
          setStatus('connected')
          if (hasConnectedOnce.current) {
            callbacksRef.current.onReconnect?.()
          }
          hasConnectedOnce.current = true
        })

        socket.on('disconnect', () => setStatus('reconnecting'))
        socket.on('connect_error', () => setStatus('reconnecting'))
        socket.on('run:created', (r: unknown) => callbacksRef.current.onRunCreated?.(normalizeRun(r)))
        socket.on('run:updated', (r: unknown) => callbacksRef.current.onRunUpdated?.(normalizeRun(r)))
        socket.on('event:created', (e: unknown) => callbacksRef.current.onEventCreated?.(normalizeEvent(e)))

        cleanupFn = () => {
          socket.disconnect()
        }
      })
    }

    return () => {
      cancelled = true
      cleanupFn?.()
    }
  }, [])

  return { status }
}
