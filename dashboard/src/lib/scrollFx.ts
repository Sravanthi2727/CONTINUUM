import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

/**
 * Split text into wrapped lines/words with an overflow:hidden mask for clean editorial line-reveal.
 * Preserves accessibility via aria-label on the root element.
 */
export function splitHeadingIntoMasks(element: HTMLElement): HTMLElement[] {
  const originalText = element.textContent || ''
  if (!element.getAttribute('aria-label')) {
    element.setAttribute('aria-label', originalText.trim())
  }

  // Preserve existing children if already split
  if (element.querySelector('.line-mask')) {
    return Array.from(element.querySelectorAll<HTMLElement>('.line-inner'))
  }

  const nodes = Array.from(element.childNodes)
  element.innerHTML = ''

  const innerSpans: HTMLElement[] = []

  nodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      const words = text.split(/(\s+)/)
      words.forEach(w => {
        if (!w) return
        if (/^\s+$/.test(w)) {
          element.appendChild(document.createTextNode(w))
          return
        }

        const mask = document.createElement('span')
        mask.className = 'line-mask'
        mask.style.display = 'inline-block'
        mask.style.overflow = 'hidden'
        mask.style.verticalAlign = 'top'

        const inner = document.createElement('span')
        inner.className = 'line-inner'
        inner.style.display = 'inline-block'
        inner.style.willChange = 'transform'
        inner.textContent = w

        mask.appendChild(inner)
        element.appendChild(mask)
        innerSpans.push(inner)
      })
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const isItalic =
        el.tagName === 'EM' ||
        el.tagName === 'I' ||
        el.style.fontStyle === 'italic' ||
        el.classList.contains('font-serif')

      const mask = document.createElement('span')
      mask.className = 'line-mask'
      mask.style.display = 'inline-block'
      mask.style.overflow = 'hidden'
      mask.style.verticalAlign = 'top'

      const inner = document.createElement('span')
      inner.className = 'line-inner' + (isItalic ? ' is-emphasis' : '')
      inner.style.display = 'inline-block'
      inner.style.willChange = 'transform'
      inner.innerHTML = el.innerHTML

      // Copy relevant styling
      if (isItalic) {
        inner.style.fontFamily = 'var(--font-serif, "Instrument Serif", serif)'
        inner.style.fontStyle = 'italic'
        inner.style.fontWeight = '400'
      }

      mask.appendChild(inner)
      element.appendChild(mask)
      innerSpans.push(inner)
    }
  })

  return innerSpans
}

/**
 * Headline reveal: yPercent 110 -> 0, duration 1.0s, stagger 0.08s, trigger top 85%, once.
 * Italic serif words get a slight delay.
 */
export function setupHeadlineReveal(heading: HTMLElement) {
  const inners = splitHeadingIntoMasks(heading)
  if (!inners.length) return

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: heading,
      start: 'top 85%',
      once: true,
    },
  })

  inners.forEach((span, idx) => {
    const isEmphasis = span.classList.contains('is-emphasis')
    tl.fromTo(
      span,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 1.0,
        ease: 'power3.out',
      },
      idx * 0.08 + (isEmphasis ? 0.08 : 0)
    )
  })
}

/**
 * Paragraph & body text reveal: y: 24 -> 0, opacity: 0 -> 1, 0.9s
 */
export function setupBodyReveal(element: HTMLElement, delay = 0) {
  gsap.fromTo(
    element,
    { y: 24, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.9,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 88%',
        once: true,
      },
    }
  )
}

/**
 * Screenshot stack scrub parallax (Section 2)
 */
export function setupScreenshotStack(
  container: HTMLElement,
  windowA: HTMLElement,
  windowB: HTMLElement
) {
  const isMobile = window.innerWidth < 768
  const rotMult = isMobile ? 0.5 : 1.0

  // Initial fade-in on viewport entry
  gsap.fromTo(
    [windowA, windowB],
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: container,
        start: 'top 85%',
        once: true,
      },
    }
  )

  // Window A scrubbed motion
  gsap.fromTo(
    windowA,
    {
      y: 80,
      rotation: -5 * rotMult,
      scale: 0.94,
    },
    {
      y: -60,
      rotation: 1.5 * rotMult,
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    }
  )

  // Window B scrubbed motion (faster parallax over Window A)
  gsap.fromTo(
    windowB,
    {
      y: 160,
      rotation: 6 * rotMult,
    },
    {
      y: -120,
      rotation: -1.5 * rotMult,
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    }
  )
}

/**
 * Numbered rows in "How it works":
 * Each row fades in with a stagger.
 * Divider line draws from scaleX: 0 -> 1 (transform-origin left).
 * Big row number slides in from x: -16.
 */
export function setupNumberedRow(
  row: HTMLElement,
  numberEl: HTMLElement | null,
  dividerEl: HTMLElement | null,
  index = 0
) {
  if (dividerEl) {
    gsap.set(dividerEl, { scaleX: 0, transformOrigin: 'left center' })
  }
  if (numberEl) {
    gsap.set(numberEl, { x: -16, opacity: 0 })
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: row,
      start: 'top 88%',
      once: true,
    },
    delay: index * 0.08,
  })

  tl.fromTo(
    row,
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
  )

  if (dividerEl) {
    tl.to(dividerEl, { scaleX: 1, duration: 0.8, ease: 'power3.out' }, '-=0.4')
  }

  if (numberEl) {
    tl.to(numberEl, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.5')
  }
}

/**
 * Table rows reveal in "One system"
 * Strikethrough scales from 0 to 1, "Here" value pops in last in --lichen.
 */
export function setupTableRow(
  row: HTMLElement,
  strikeLine: HTMLElement | null,
  hereValue: HTMLElement | null,
  index = 0
) {
  if (strikeLine) {
    gsap.set(strikeLine, { scaleX: 0, transformOrigin: 'left center' })
  }
  if (hereValue) {
    gsap.set(hereValue, { opacity: 0, scale: 0.9 })
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: row,
      start: 'top 88%',
      once: true,
    },
    delay: index * 0.08,
  })

  tl.fromTo(
    row,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
  )

  if (strikeLine) {
    tl.to(strikeLine, { scaleX: 1, duration: 0.55, ease: 'power2.inOut' }, '-=0.2')
  }

  if (hereValue) {
    tl.to(hereValue, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, '-=0.15')
  }
}

/**
 * Ensure ScrollTrigger is updated after fonts and images finish loading
 */
export function bindScrollTriggerRefresh() {
  if (typeof document === 'undefined') return () => {}

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh()
    })
  }

  const onLoad = () => {
    ScrollTrigger.refresh()
  }
  if (document.readyState === 'complete') {
    ScrollTrigger.refresh()
  } else {
    window.addEventListener('load', onLoad, { once: true })
  }

  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 150)
  }

  window.addEventListener('resize', handleResize, { passive: true })
  return () => {
    window.removeEventListener('load', onLoad)
    if (resizeTimer) clearTimeout(resizeTimer)
    window.removeEventListener('resize', handleResize)
  }
}

