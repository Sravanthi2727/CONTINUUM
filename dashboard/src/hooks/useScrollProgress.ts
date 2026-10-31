import { useEffect, useState } from 'react'

export interface ScrollState {
  progress: number // 0..1
  activeSection: number // 0..3
}

export function useScrollProgress(): ScrollState {
  const [state, setState] = useState<ScrollState>({ progress: 0, activeSection: 0 })

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const doc = document.documentElement
          const scrollTop = window.scrollY || doc.scrollTop || 0
          const scrollHeight = (doc.scrollHeight || 1) - (doc.clientHeight || 1)
          const progress = scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0

          // Calculate active section based on scroll position or element offsets
          // 4 sections: Hero (0), What it is (1), How it works (2), One system & CTA (3)
          let activeSection = 0
          if (progress >= 0.72) {
            activeSection = 3
          } else if (progress >= 0.42) {
            activeSection = 2
          } else if (progress >= 0.15) {
            activeSection = 1
          } else {
            activeSection = 0
          }

          setState({ progress, activeSection })
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return state
}
