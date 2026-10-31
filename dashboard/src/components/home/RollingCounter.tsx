import { useEffect, useState } from 'react'
import { fetchProjects } from '../../api/endpoints'
import { USE_MOCKS } from '../../config'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface RollingCounterProps {
  label?: string
}

function DigitColumn({ digit, prefersReducedMotion }: { digit: string; prefersReducedMotion: boolean }) {
  if (digit === "'") {
    return (
      <span
        style={{
          display: 'inline-block',
          width: '7px',
          textAlign: 'center',
          color: 'var(--saffron)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
        }}
      >
        '
      </span>
    )
  }

  const num = parseInt(digit, 10)
  const validNum = isNaN(num) ? 0 : num

  return (
    <div
      style={{
        display: 'inline-block',
        height: '1.2em',
        lineHeight: '1.2em',
        overflow: 'hidden',
        verticalAlign: 'bottom',
        width: '0.65em',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        color: 'var(--fossil)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          transform: `translateY(-${validNum * 10}%)`,
          transition: prefersReducedMotion ? 'none' : 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <span key={n} style={{ height: '1.2em', lineHeight: '1.2em' }}>
            {n}
          </span>
        ))}
      </div>
    </div>
  )
}

export function RollingCounter({ label = 'runs recorded' }: RollingCounterProps) {
  const prefersReducedMotion = useReducedMotion()
  const [count, setCount] = useState<number | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadCount() {
      try {
        const projects = await fetchProjects()
        if (!mounted) return
        const sum = projects.reduce((acc, p) => acc + (p.stats?.total_runs || 0), 0)
        // If mock or demo has small count, pad to realistic telemetry scale (e.g. 1'471)
        const finalCount = sum > 0 ? (USE_MOCKS ? 1471 + sum : sum) : (USE_MOCKS ? 1471 : 0)
        setCount(finalCount)
        setIsOffline(false)
      } catch {
        if (!mounted) return
        if (USE_MOCKS) {
          setCount(1471)
          setIsOffline(false)
        } else {
          setIsOffline(true)
        }
      }
    }

    loadCount()
    const timer = setInterval(loadCount, 25_000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  // Format with apostrophe separator (e.g. 1'471)
  const formattedDigits = (() => {
    if (count === null || isOffline) return []
    const str = count.toLocaleString('en-US').replace(/,/g, "'")
    return str.split('')
  })()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      {isOffline ? (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--fossil-dim)',
          }}
        >
          offline
        </span>
      ) : count === null ? (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-lg)',
            color: 'var(--fossil-dim)',
          }}
        >
          ...
        </span>
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', fontSize: 'var(--text-xl)' }}>
          {formattedDigits.map((char, index) => (
            <DigitColumn key={index} digit={char} prefersReducedMotion={prefersReducedMotion} />
          ))}
        </div>
      )}
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          color: 'var(--fossil-dim)',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
    </div>
  )
}

