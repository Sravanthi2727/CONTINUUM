import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  body?: string
}

interface ToastContextValue {
  showToast: (t: Omit<ToastMessage, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [leaving, setLeaving] = useState(false)
  const colorMap = { success: 'var(--lichen)', error: 'var(--fault)', info: 'var(--saffron)' }
  const color = colorMap[toast.type]

  const dismiss = useCallback(() => {
    setLeaving(true)
    setTimeout(() => onDismiss(toast.id), 300)
  }, [toast.id, onDismiss])

  useEffect(() => {
    const t = setTimeout(() => dismiss(), 6000)
    return () => clearTimeout(t)
  }, [dismiss])

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        background: 'var(--ink-raised)',
        borderLeft: `3px solid ${color}`,
        padding: '10px 14px',
        minWidth: 280,
        maxWidth: 380,
        animation: leaving
          ? 'toast-slide-out 0.3s ease-in forwards'
          : 'toast-slide-in 0.25s ease-out forwards',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 'var(--text-sm)',
          color,
          lineHeight: 1.3,
        }}>
          {toast.title}
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss notification"
          style={{ color: 'var(--fossil-dim)', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
        >
          ×
        </button>
      </div>
      {toast.body && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', marginTop: 4, lineHeight: 1.5 }}>
          {toast.body}
        </p>
      )}
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const counterRef = useRef(0)

  const showToast = useCallback((t: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${++counterRef.current}`
    setToasts(prev => [...prev, { ...t, id }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-label="Notifications"
        style={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
