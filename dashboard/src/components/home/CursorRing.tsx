import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function CursorRing() {
  const prefersReducedMotion = useReducedMotion()
  const ringRef = useRef<HTMLDivElement | null>(null)
  const [isHoveringClickable, setIsHoveringClickable] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) return

    // Hide if touch device
    if (window.matchMedia('(pointer: coarse)').matches) return

    let mouseX = -100
    let mouseY = -100
    let currentX = -100
    let currentY = -100
    let rafId: number | null = null

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (!isVisible) setIsVisible(true)

      const target = e.target as HTMLElement | null
      const isInteractive = Boolean(
        target && (target.closest('a') || target.closest('button') || target.closest('[role="button"]'))
      )
      setIsHoveringClickable(isInteractive)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const loop = () => {
      // Lerp smooth follow
      currentX += (mouseX - currentX) * 0.2
      currentY += (mouseY - currentY) * 0.2

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`
      }

      rafId = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.body.addEventListener('mouseleave', handleMouseLeave)
    rafId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.removeEventListener('mouseleave', handleMouseLeave)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isVisible, prefersReducedMotion])

  if (prefersReducedMotion) return null

  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease, width 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease',
        width: isHoveringClickable ? 44 : 26,
        height: isHoveringClickable ? 44 : 26,
        borderRadius: '50%',
        border: '1.5px solid var(--saffron)',
        backgroundColor: isHoveringClickable ? 'rgba(227, 169, 43, 0.18)' : 'transparent',
        mixBlendMode: 'screen',
      }}
    />
  )
}
