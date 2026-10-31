import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: 'var(--sp-8)',
            margin: 'var(--sp-8) auto',
            maxWidth: 760,
            background: 'var(--ink-raised)',
            border: '2px solid var(--fault)',
            borderRadius: 6,
            color: 'var(--fossil)',
          }}
        >
          <div
            style={{
              color: 'var(--fault)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              marginBottom: 8,
              letterSpacing: '0.06em',
            }}
          >
            HOMEPAGE RENDER ERROR CAUGHT
          </div>
          <h2
            className="font-display"
            style={{ fontSize: 'var(--text-xl)', marginBottom: 12, fontWeight: 700 }}
          >
            {this.props.fallbackTitle || 'A component failed to render.'}
          </h2>
          <pre
            style={{
              background: 'var(--ink)',
              padding: 12,
              borderRadius: 4,
              color: 'var(--fault)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              marginBottom: 16,
            }}
          >
            {this.state.error?.toString()}
          </pre>
          {this.state.errorInfo?.componentStack && (
            <pre
              style={{
                background: 'var(--ink)',
                padding: 12,
                borderRadius: 4,
                color: 'var(--fossil-dim)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                maxHeight: 220,
              }}
            >
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: 16,
              background: 'var(--saffron)',
              color: 'var(--ink)',
              padding: '8px 16px',
              borderRadius: 3,
              fontWeight: 700,
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Try Recover
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

