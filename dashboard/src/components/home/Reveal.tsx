import React, { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface RevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
  style?: React.CSSProperties
}

export function Reveal({ children, delay = 0, className, style }: RevealProps) {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const el = ref.current
    if (!el) {
      setIsVisible(true)
      return
    }

    // Safety timeout: ensure content is never stuck at opacity: 0
    const safetyTimer = setTimeout(() => {
      setIsVisible(true)
    }, 400 + delay)

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      clearTimeout(safetyTimer)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          clearTimeout(safetyTimer)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.01, rootMargin: '60px 0px 60px 0px' }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(safetyTimer)
    }
  }, [delay, prefersReducedMotion])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: isVisible || prefersReducedMotion ? 1 : 0,
        transform: isVisible || prefersReducedMotion ? 'none' : 'translateY(16px)',
        transition: prefersReducedMotion
          ? 'none'
          : `opacity 500ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 500ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

interface StaggerWordsProps {
  text: string
  italicWords?: string[]
  className?: string
  style?: React.CSSProperties
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

export function StaggerWords({
  text,
  italicWords = [],
  className,
  style,
  as: Component = 'h2',
}: StaggerWordsProps) {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const el = ref.current
    if (!el) {
      setIsVisible(true)
      return
    }

    const safetyTimer = setTimeout(() => {
      setIsVisible(true)
    }, 500)

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      clearTimeout(safetyTimer)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          clearTimeout(safetyTimer)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.01, rootMargin: '60px 0px 60px 0px' }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(safetyTimer)
    }
  }, [prefersReducedMotion])

  const words = text.split(' ')

  return (
    // @ts-expect-error dynamic component type
    <Component
      ref={ref}
      className={className}
      style={{
        ...style,
      }}
    >
      {words.map((word, i) => {
        const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        const isItalic = italicWords.some(w => w.toLowerCase() === cleanWord)

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              marginRight: '0.28em',
              opacity: isVisible || prefersReducedMotion ? 1 : 0,
              transform: isVisible || prefersReducedMotion ? 'none' : 'translateY(12px)',
              transition: prefersReducedMotion
                ? 'none'
                : `opacity 400ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 35}ms, transform 400ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 35}ms`,
              fontFamily: isItalic ? 'var(--font-serif)' : undefined,
              fontStyle: isItalic ? 'italic' : undefined,
              fontWeight: isItalic ? 400 : undefined,
            }}
          >
            {word}
          </span>
        )
      })}
    </Component>
  )
}
