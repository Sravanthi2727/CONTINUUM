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
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  if (prefersReducedMotion) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 500ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 500ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
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
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  const words = text.split(' ')

  return (
    // @ts-expect-error dynamic component type
    <Component
      ref={ref}
      className={className}
      style={{
        ...style,
        display: 'inline-block',
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
              transform: isVisible || prefersReducedMotion ? 'translateY(0)' : 'translateY(12px)',
              transition: prefersReducedMotion
                ? 'none'
                : `opacity 400ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 40}ms, transform 400ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 40}ms`,
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
