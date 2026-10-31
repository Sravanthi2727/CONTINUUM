import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function CursorRing() {
  const prefersReducedMotion = useReducedMotion()
  const ringRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (prefersReducedMotion) return
    if (typeof window === 'undefined') return

    // Hide if touch device or coarse pointer
    if (window.matchMedia('(pointer: coarse)').matches) return

    let mouseX = -100
    let mouseY = -100
    let currentX = -100
    let currentY = -100
    let rafId: number | null = null
    let visible = false
    let hovered = false

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY

      if (!visible) {
        visible = true
        if (ringRef.current) ringRef.current.style.opacity = '1'
      }

      const target = e.target as HTMLElement | null
      const isInteractive = Boolean(
        target && (target.closest('a') || target.closest('button') || target.closest('[role="button"]'))
      )

      if (isInteractive !== hovered) {
        hovered = isInteractive
        if (ringRef.current) {
          ringRef.current.style.width = hovered ? '44px' : '26px'
          ringRef.current.style.height = hovered ? '44px' : '26px'
          ringRef.current.style.backgroundColor = hovered ? 'rgba(227, 169, 43, 0.18)' : 'transparent'
        }
      }
    }

    const handleMouseLeave = () => {
      visible = false
      if (ringRef.current) ringRef.current.style.opacity = '0'
    }

    const loop = () => {
      currentX += (mouseX - currentX) * 0.2
      currentY += (mouseY - currentY) * 0.2

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`
      }

      rafId = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.body.addEventListener('mouseleave', handleMouseLeave, { passive: true })
    rafId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.removeEventListener('mouseleave', handleMouseLeave)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [prefersReducedMotion])

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
        opacity: 0,
        width: 26,
        height: 26,
        borderRadius: '50%',
        border: '1.5px solid var(--saffron)',
        backgroundColor: 'transparent',
        transition: 'opacity 0.2s ease, width 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease',
        mixBlendMode: 'screen',
      }}
    />
  )
}
