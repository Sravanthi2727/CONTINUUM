import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

let activeLenis: Lenis | null = null
let tickerCallback: ((time: number) => void) | null = null

export function getLenis(): Lenis | null {
  return activeLenis
}

export function getScrollVelocity(): number {
  return activeLenis?.velocity || 0
}

export function scrollToTarget(
  target: string | HTMLElement,
  options: { duration?: number; offset?: number } = {}
) {
  if (activeLenis) {
    activeLenis.scrollTo(target, {
      duration: options.duration ?? 1.4,
      offset: options.offset ?? 0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    el?.scrollIntoView({ behavior: 'smooth' })
  }
}

export function initSmoothScroll(): () => void {
  // If reduced motion is preferred or server-side, skip Lenis
  if (typeof window === 'undefined') return () => {}
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) return () => {}

  // Mobile / touch devices check: allow native smooth touch
  const isTouch = window.matchMedia('(pointer: coarse)').matches

  if (activeLenis) {
    activeLenis.destroy()
    activeLenis = null
  }

  const lenis = new Lenis({
    lerp: isTouch ? 0.12 : 0.085,
    smoothWheel: true,
    syncTouch: false,
  })

  activeLenis = lenis

  // Drive Lenis from GSAP's ticker
  tickerCallback = (time: number) => {
    lenis.raf(time * 1000)
  }

  gsap.ticker.add(tickerCallback)
  gsap.ticker.lagSmoothing(0)

  // Notify ScrollTrigger on scroll
  const onScroll = () => {
    ScrollTrigger.update()
  }
  lenis.on('scroll', onScroll)

  return () => {
    if (tickerCallback) {
      gsap.ticker.remove(tickerCallback)
      tickerCallback = null
    }
    lenis.off('scroll', onScroll)
    lenis.destroy()
    if (activeLenis === lenis) {
      activeLenis = null
    }
    ScrollTrigger.refresh()
  }
}

