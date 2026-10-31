import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export interface ParticleFieldHandle {
  shuffle: () => void
  breakLayer: () => void
}

interface ParticleFieldProps {
  onShuffleNotice?: () => void
  onBreakNotice?: () => void
}

export const ParticleField = forwardRef<ParticleFieldHandle, ParticleFieldProps>(
  function ParticleField({ onShuffleNotice, onBreakNotice }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const prefersReducedMotion = useReducedMotion()

    // Animation state refs (mutable, no re-renders)
    const animRef = useRef<{
      running: boolean
      rafId: number | null
      lastTime: number
      // Chladni mode params
      nCur: number
      mCur: number
      nTgt: number
      mTgt: number
      morphTime: number
      morphDuration: number
      morphBoost: number
      // Idle time
      time: number
      // Mouse state
      pointerX: number
      pointerY: number
      pointerActive: boolean
      pointerSpeed: number
      lastPointerX: number
      lastPointerY: number
      // Particle data
      count: number
      originalCount: number
      x: Float32Array
      y: Float32Array
      colorBucket: Uint8Array
      faultIntensity: Float32Array
      // Dimensions
      width: number
      height: number
      dpr: number
      // Performance throttling
      slowFramesCount: number
      throttleLevel: number
    } | null>(null)

    // Helper: random pair (n, m) from 2..8, n != m
    const getRandomMode = useCallback(() => {
      const modes = [
        [2, 3], [3, 4], [2, 5], [3, 5], [4, 5],
        [3, 6], [4, 6], [5, 6], [3, 7], [4, 7],
        [5, 7], [6, 7], [2, 7], [4, 8], [5, 8],
      ]
      return modes[Math.floor(Math.random() * modes.length)]
    }, [])

    // Imperative API
    const shuffle = useCallback(() => {
      const state = animRef.current
      if (!state) return

      let [nextN, nextM] = getRandomMode()
      while (nextN === Math.round(state.nTgt) && nextM === Math.round(state.mTgt)) {
        ;[nextN, nextM] = getRandomMode()
      }

      state.nTgt = nextN
      state.mTgt = nextM
      state.morphTime = 0
      state.morphDuration = 1.2
      state.morphBoost = 2.2

      onShuffleNotice?.()

      // If motion is reduced, recompute immediately and draw once
      if (prefersReducedMotion) {
        state.nCur = nextN
        state.mCur = nextM
        drawStatic()
      }
    }, [getRandomMode, onShuffleNotice, prefersReducedMotion])

    const breakLayer = useCallback(() => {
      const state = animRef.current
      if (!state) return

      // Choose a random fault crack origin
      const crackX = 0.2 + Math.random() * 0.6
      const crackY = 0.2 + Math.random() * 0.6
      const crackAngle = (Math.random() - 0.5) * 1.6 // semi-horizontal or diagonal
      const cosA = Math.cos(crackAngle)
      const sinA = Math.sin(crackAngle)
      const crackLength = 0.35 + Math.random() * 0.25

      const x = state.x
      const y = state.y
      const fault = state.faultIntensity
      const count = state.count

      // Ignite particles along the crack line
      for (let i = 0; i < count; i++) {
        const dx = x[i] - crackX
        const dy = y[i] - crackY

        // Project onto crack direction
        const proj = dx * cosA + dy * sinA
        const perp = Math.abs(-dx * sinA + dy * cosA)

        if (Math.abs(proj) < crackLength && perp < 0.045) {
          fault[i] = 1.0 + Math.random() * 0.4
          // Perpendicular burst shockwave
          const sign = perp === 0 ? (Math.random() > 0.5 ? 1 : -1) : Math.sign(-dx * sinA + dy * cosA)
          x[i] += (-sinA * sign) * (0.015 + Math.random() * 0.02)
          y[i] += (cosA * sign) * (0.015 + Math.random() * 0.02)
        }
      }

      onBreakNotice?.()

      if (prefersReducedMotion) {
        drawStatic()
      }
    }, [onBreakNotice, prefersReducedMotion])

    useImperativeHandle(ref, () => ({ shuffle, breakLayer }), [shuffle, breakLayer])

    // Draw static pattern for reduced motion
    const drawStatic = useCallback(() => {
      const canvas = canvasRef.current
      const state = animRef.current
      if (!canvas || !state) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const { width, height, count, x, y, colorBucket, nCur, mCur } = state
      ctx.clearRect(0, 0, width, height)

      // Settle static particles onto nodal lines
      const pi = Math.PI
      for (let step = 0; step < 40; step++) {
        for (let i = 0; i < count; i++) {
          const u =
            Math.cos(nCur * pi * x[i]) * Math.cos(mCur * pi * y[i]) -
            Math.cos(mCur * pi * x[i]) * Math.cos(nCur * pi * y[i])
          const stepSize = Math.abs(u) * 0.005
          x[i] += (Math.random() - 0.5) * stepSize
          y[i] += (Math.random() - 0.5) * stepSize
          if (x[i] < 0.01) x[i] = 0.01
          if (x[i] > 0.99) x[i] = 0.99
          if (y[i] < 0.01) y[i] = 0.01
          if (y[i] > 0.99) y[i] = 0.99
        }
      }

      // Render buckets
      const colors = [
        'rgba(227, 169, 43, 0.7)',  // Saffron
        'rgba(201, 162, 126, 0.65)', // Sandstone
        'rgba(232, 224, 210, 0.85)', // Fossil
      ]

      for (let b = 0; b < 3; b++) {
        ctx.fillStyle = colors[b]
        for (let i = 0; i < count; i++) {
          if (colorBucket[i] === b) {
            ctx.fillRect(x[i] * width, y[i] * height, 1.2, 1.2)
          }
        }
      }
    }, [])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const isMobile = window.innerWidth < 768
      const count = isMobile ? 3500 : 9000
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      const rect = canvas.getBoundingClientRect()
      const width = rect.width || window.innerWidth
      const height = rect.height || window.innerHeight

      canvas.width = width * dpr
      canvas.height = height * dpr

      const ctx = canvas.getContext('2d', { alpha: true })
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      // Initialize Float32Array buffers
      const x = new Float32Array(count)
      const y = new Float32Array(count)
      const colorBucket = new Uint8Array(count)
      const faultIntensity = new Float32Array(count)

      for (let i = 0; i < count; i++) {
        x[i] = Math.random()
        y[i] = Math.random()
        const rand = Math.random()
        if (rand < 0.58) {
          colorBucket[i] = 0 // saffron
        } else if (rand < 0.92) {
          colorBucket[i] = 1 // sandstone
        } else {
          colorBucket[i] = 2 // fossil
        }
        faultIntensity[i] = 0
      }

      const [initN, initM] = [3, 5]

      animRef.current = {
        running: true,
        rafId: null,
        lastTime: performance.now(),
        nCur: initN,
        mCur: initM,
        nTgt: initN,
        mTgt: initM,
        morphTime: 1.2,
        morphDuration: 1.2,
        morphBoost: 0,
        time: 0,
        pointerX: -1000,
        pointerY: -1000,
        pointerActive: false,
        pointerSpeed: 0,
        lastPointerX: -1000,
        lastPointerY: -1000,
        count,
        originalCount: count,
        x,
        y,
        colorBucket,
        faultIntensity,
        width,
        height,
        dpr,
        slowFramesCount: 0,
        throttleLevel: 0,
      }

      // If prefers-reduced-motion, draw once and exit
      if (prefersReducedMotion) {
        drawStatic()
        return
      }

      // ── Main Simulation & Render Loop ─────────────────────────────────────
      const colors = [
        'rgba(227, 169, 43, 0.72)',  // saffron
        'rgba(201, 162, 126, 0.68)', // sandstone
        'rgba(232, 224, 210, 0.82)', // fossil sparkle
      ]

      const faultColorBase = '240, 69, 127' // #F0457F (--fault)

      const tick = (now: number) => {
        const state = animRef.current
        if (!state || !state.running) return

        const dtRaw = (now - state.lastTime) / 1000
        state.lastTime = now

        // Clamp dt for stable delta-time simulation across 60Hz - 144Hz
        const dt = Math.min(Math.max(dtRaw, 0.008), 0.04)

        // Performance guard: if frame took > 24ms (~41 FPS) consistently, throttle particle count
        if (dtRaw > 0.024) {
          state.slowFramesCount++
          if (state.slowFramesCount > 120 && state.throttleLevel < 2) {
            state.throttleLevel++
            state.count = Math.floor(state.count * 0.7)
            state.slowFramesCount = 0
          }
        } else {
          state.slowFramesCount = Math.max(0, state.slowFramesCount - 1)
        }

        state.time += dt

        // Morph lerp
        if (state.morphTime < state.morphDuration) {
          state.morphTime += dt
          const t = Math.min(1, state.morphTime / state.morphDuration)
          // Smooth easeInOutCubic
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
          state.nCur = state.nCur + (state.nTgt - state.nCur) * (0.05 + 0.15 * ease)
          state.mCur = state.mCur + (state.mTgt - state.mCur) * (0.05 + 0.15 * ease)
          state.morphBoost = Math.max(0, state.morphBoost - dt * 1.8)
        } else {
          state.nCur = state.nTgt
          state.mCur = state.mTgt
          state.morphBoost = 0
        }

        // Idle drift: very gentle breathing
        const idleN = state.nCur + Math.sin(state.time * 0.28) * 0.025
        const idleM = state.mCur + Math.cos(state.time * 0.22) * 0.025

        const pi = Math.PI
        const width = state.width
        const height = state.height
        const count = state.count
        const x = state.x
        const y = state.y
        const fault = state.faultIntensity

        // Pointer repulsion calculations
        const pActive = state.pointerActive
        const pNormX = state.pointerX / width
        const pNormY = state.pointerY / height
        // ~90px radius in normalized coords
        const pRadiusNorm = 95 / Math.min(width, height)
        const pRadiusSq = pRadiusNorm * pRadiusNorm
        const pForceBase = (0.003 + Math.min(state.pointerSpeed * 0.00008, 0.006))

        const baseStepScale = 0.0032 * (1.0 + state.morphBoost)

        // Clear canvas
        if (ctx) {
          ctx.clearRect(0, 0, width, height)
        }

        // ── Physics update ──
        for (let i = 0; i < count; i++) {
          const xi = x[i]
          const yi = y[i]

          // Chladni standing wave function u(x, y)
          const u =
            Math.cos(idleN * pi * xi) * Math.cos(idleM * pi * yi) -
            Math.cos(idleM * pi * xi) * Math.cos(idleN * pi * yi)

          // Step proportional to |u|: large |u| jitters, u ≈ 0 stays
          const absU = Math.abs(u)
          const stepSize = absU * baseStepScale

          let dx = (Math.random() - 0.5) * stepSize
          let dy = (Math.random() - 0.5) * stepSize

          // Mouse push
          if (pActive) {
            const mdx = xi - pNormX
            const mdy = yi - pNormY
            const distSq = mdx * mdx + mdy * mdy
            if (distSq < pRadiusSq && distSq > 0.000001) {
              const dist = Math.sqrt(distSq)
              const pushFactor = (1.0 - dist / pRadiusNorm) * pForceBase
              dx += (mdx / dist) * pushFactor + (Math.random() - 0.5) * 0.001
              dy += (mdy / dist) * pushFactor + (Math.random() - 0.5) * 0.001
            }
          }

          // Fault crack settling
          if (fault[i] > 0) {
            fault[i] = Math.max(0, fault[i] - dt * 0.75)
            // Extra random jitter while crack heals
            dx += (Math.random() - 0.5) * 0.002 * fault[i]
            dy += (Math.random() - 0.5) * 0.002 * fault[i]
          }

          // Apply and bound
          let nx = xi + dx
          let ny = yi + dy

          if (nx < 0.005) nx = 0.005 + Math.random() * 0.01
          if (nx > 0.995) nx = 0.995 - Math.random() * 0.01
          if (ny < 0.005) ny = 0.005 + Math.random() * 0.01
          if (ny > 0.995) ny = 0.995 - Math.random() * 0.01

          x[i] = nx
          y[i] = ny
        }

        // ── Batched Drawing ──
        if (ctx) {
          const colorBucket = state.colorBucket

          // Regular particles (buckets 0, 1, 2)
          for (let b = 0; b < 3; b++) {
            ctx.fillStyle = colors[b]
            for (let i = 0; i < count; i++) {
              if (colorBucket[i] === b && fault[i] <= 0) {
                ctx.fillRect(x[i] * width, y[i] * height, 1.25, 1.25)
              }
            }
          }

          // Fault particles (crack burst)
          for (let i = 0; i < count; i++) {
            if (fault[i] > 0) {
              const alpha = Math.min(1, fault[i]) * 0.9
              ctx.fillStyle = `rgba(${faultColorBase}, ${alpha})`
              ctx.fillRect(x[i] * width, y[i] * height, 1.5, 1.5)
            }
          }
        }

        state.rafId = requestAnimationFrame(tick)
      }

      state.rafId = requestAnimationFrame(tick)

      // ── Event Handlers: Mouse Interaction ──
      const handleMouseMove = (e: MouseEvent) => {
        const state = animRef.current
        if (!state) return
        const rect = canvas.getBoundingClientRect()
        const clientX = e.clientX - rect.left
        const clientY = e.clientY - rect.top

        if (state.lastPointerX > -500) {
          const pdx = clientX - state.lastPointerX
          const pdy = clientY - state.lastPointerY
          state.pointerSpeed = Math.sqrt(pdx * pdx + pdy * pdy)
        }

        state.pointerX = clientX
        state.pointerY = clientY
        state.lastPointerX = clientX
        state.lastPointerY = clientY
        state.pointerActive = true
      }

      const handleMouseLeave = () => {
        const state = animRef.current
        if (!state) return
        state.pointerActive = false
        state.pointerX = -1000
        state.pointerY = -1000
        state.lastPointerX = -1000
        state.lastPointerY = -1000
        state.pointerSpeed = 0
      }

      window.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.body.addEventListener('mouseleave', handleMouseLeave)

      // ── Visibility & Intersection Handling ──
      const handleVisibilityChange = () => {
        const state = animRef.current
        if (!state) return
        if (document.hidden) {
          state.running = false
          if (state.rafId) cancelAnimationFrame(state.rafId)
        } else {
          state.running = true
          state.lastTime = performance.now()
          state.rafId = requestAnimationFrame(tick)
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      const observer = new IntersectionObserver(
        entries => {
          const entry = entries[0]
          const state = animRef.current
          if (!state) return
          if (entry.isIntersecting) {
            if (!state.running) {
              state.running = true
              state.lastTime = performance.now()
              state.rafId = requestAnimationFrame(tick)
            }
          } else {
            state.running = false
            if (state.rafId) cancelAnimationFrame(state.rafId)
          }
        },
        { threshold: 0.05 }
      )

      observer.observe(canvas)

      // ── Debounced Resize ──
      let resizeTimer: ReturnType<typeof setTimeout> | null = null
      const handleResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          const state = animRef.current
          if (!canvas || !state) return
          const newRect = canvas.getBoundingClientRect()
          const newWidth = newRect.width || window.innerWidth
          const newHeight = newRect.height || window.innerHeight

          canvas.width = newWidth * state.dpr
          canvas.height = newHeight * state.dpr

          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.scale(state.dpr, state.dpr)
          }

          state.width = newWidth
          state.height = newHeight

          if (prefersReducedMotion) {
            drawStatic()
          }
        }, 150)
      }

      window.addEventListener('resize', handleResize)

      return () => {
        const state = animRef.current
        if (state) {
          state.running = false
          if (state.rafId) cancelAnimationFrame(state.rafId)
        }
        window.removeEventListener('mousemove', handleMouseMove)
        document.body.removeEventListener('mouseleave', handleMouseLeave)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('resize', handleResize)
        observer.disconnect()
        if (resizeTimer) clearTimeout(resizeTimer)
      }
    }, [drawStatic, prefersReducedMotion])

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    )
  }
)
