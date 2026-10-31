import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { gsap } from '../../lib/scrollFx'
import { getScrollVelocity } from '../../lib/smoothScroll'

export function RotatingBadge() {
  const prefersReducedMotion = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const rotationRef = useRef(0)
  const boostRef = useRef(0)
  const isHoveredRef = useRef(false)
  isHoveredRef.current = isHovered

  useEffect(() => {
    if (prefersReducedMotion) return

    const tick = () => {
      const svg = svgRef.current
      if (!svg) return

      // Base rotation rate: faster on hover (~0.35 deg/frame) vs idle (~0.075 deg/frame)
      const baseRate = isHoveredRef.current ? 0.38 : 0.085

      // Scroll velocity boost: add velocity * 0.4 deg per frame
      const vel = Math.abs(getScrollVelocity())
      boostRef.current += vel * 0.4
      // Exponential decay back to 0
      boostRef.current *= 0.88

      rotationRef.current = (rotationRef.current + baseRate + boostRef.current) % 360
      svg.style.transform = `rotate(${rotationRef.current}deg)`
    }

    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
    }
  }, [prefersReducedMotion])

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
        display: 'block',
        width: size,
        height: size,
        textDecoration: 'none',
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        <defs>
          <path
            id="badge-circle-path"
            d={`M ${center},${center} m -${radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`}
          />
        </defs>

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

        <circle
          cx={center}
          cy={center}
          r="4"
          fill={isHovered ? 'var(--saffron)' : 'var(--fossil-dim)'}
          style={{ transition: 'fill 0.2s ease' }}
        />
      </svg>
    </Link>
  )
}
