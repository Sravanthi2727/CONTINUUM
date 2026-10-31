import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useScrollProgress } from '../../hooks/useScrollProgress'

export function ScrollIndicators() {
  const { progress, activeSection } = useScrollProgress()
  const prefersReducedMotion = useReducedMotion()

  return (
    <>
      {/* Bottom Center: Four section dashes */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 15,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {[0, 1, 2, 3].map(sec => {
          const isActive = activeSection === sec
          return (
            <div
              key={sec}
              style={{
                width: isActive ? 18 : 12,
                height: 2,
                backgroundColor: isActive ? 'var(--saffron)' : 'var(--fossil-dim)',
                opacity: isActive ? 1 : 0.35,
                transform: isActive && !prefersReducedMotion ? 'rotate(-32deg) translateY(-1px)' : 'none',
                transition: prefersReducedMotion ? 'none' : 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                borderRadius: 1,
              }}
            />
          )
        })}
      </div>

      {/* Right Edge: Thin vertical scroll progress line placed above bottom controls */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: 86,
          right: 24,
          zIndex: 15,
          width: 2,
          height: 56,
          backgroundColor: 'rgba(232, 224, 210, 0.15)',
          borderRadius: 1,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--saffron)',
            transform: `scaleY(${progress})`,
            transformOrigin: 'top center',
            transition: prefersReducedMotion ? 'none' : 'transform 0.08s linear',
          }}
        />
      </div>
    </>
  )
}
