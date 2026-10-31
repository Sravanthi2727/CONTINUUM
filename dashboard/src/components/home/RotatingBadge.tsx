import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function RotatingBadge() {
  const prefersReducedMotion = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)

  const size = 260
  const radius = 95
  const center = size / 2

  return (
    <Link
      to="/projects"
      aria-label="Open the latest run in the dashboard projects view"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        top: '50%',
        right: -85,
        transform: 'translateY(-50%)',
        width: size,
        height: size,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
      }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{
          width: '100%',
          height: '100%',
          animation: prefersReducedMotion
            ? 'none'
            : `spin-badge ${isHovered ? '24s' : '75s'} linear infinite`,
          transformOrigin: 'center center',
        }}
      >
        <defs>
          <path
            id="badge-circle-path"
            d={`M ${center},${center} m -${radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`}
          />
        </defs>

        {/* Central decorative glyph */}
        <circle
          cx={center}
          cy={center}
          r={radius - 22}
          fill="none"
          stroke="rgba(232, 224, 210, 0.12)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        <text
          fill="var(--fossil-dim)"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            fontWeight: 500,
            fill: isHovered ? 'var(--saffron)' : 'var(--fossil-dim)',
            transition: 'fill 0.2s ease',
          }}
        >
          <textPath href="#badge-circle-path" startOffset="0%">
            OPEN THE LATEST RUN ✧ OPEN THE LATEST RUN ✧
          </textPath>
        </text>

        {/* Center icon */}
        <circle
          cx={center}
          cy={center}
          r="4"
          fill={isHovered ? 'var(--saffron)' : 'var(--fossil-dim)'}
          style={{ transition: 'fill 0.2s ease' }}
        />
      </svg>

      <style>{`
        @keyframes spin-badge {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Link>
  )
}
