import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { getScrollVelocity } from '../../lib/smoothScroll'

export interface ParticleFieldHandle {
  shuffle: () => void
  breakLayer: () => void
  setMode: (n: number, m: number) => void
}

interface ParticleFieldProps {
  onShuffleNotice?: () => void
  onBreakNotice?: () => void
}

export const ParticleField = forwardRef<ParticleFieldHandle, ParticleFieldProps>(
  function ParticleField({ onShuffleNotice, onBreakNotice }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const prefersReducedMotion = useReducedMotion()

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

    const getRandomMode = useCallback(() => {
      const modes = [
        [2, 3], [3, 4], [2, 5], [3, 5], [4, 5],
        [3, 6], [4, 6], [5, 6], [3, 7], [4, 7],
        [5, 7], [6, 7], [2, 7], [4, 8], [5, 8],
      ]
      return modes[Math.floor(Math.random() * modes.length)]
    }, [])

    const drawStatic = useCallback(() => {
      const canvas = canvasRef.current
      const state = animRef.current
      if (!canvas || !state) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const { width, height, count, x, y, colorBucket, nCur, mCur } = state
      ctx.clearRect(0, 0, width, height)

      const pi = Math.PI
      const pSize = window.innerWidth < 768 ? 1.6 : 1.95

      // Quick 40-step convergence with gradient nudge
      for (let step = 0; step < 40; step++) {
        for (let i = 0; i < count; i++) {
          const xi = x[i]
          const yi = y[i]
          const u =
            Math.cos(nCur * pi * xi) * Math.cos(mCur * pi * yi) -
            Math.cos(mCur * pi * xi) * Math.cos(nCur * pi * yi)
          const du_dx =
            -nCur * pi * Math.sin(nCur * pi * xi) * Math.cos(mCur * pi * yi) +
            mCur * pi * Math.sin(mCur * pi * xi) * Math.cos(nCur * pi * yi)
          const du_dy =
            -mCur * pi * Math.cos(nCur * pi * xi) * Math.sin(mCur * pi * yi) +
            nCur * pi * Math.cos(mCur * pi * xi) * Math.sin(nCur * pi * yi)
          const normSq = du_dx * du_dx + du_dy * du_dy + 0.001
          const nudge = (u / normSq) * 0.003
          x[i] += (Math.random() - 0.5) * Math.abs(u) * 0.005 - du_dx * nudge
          y[i] += (Math.random() - 0.5) * Math.abs(u) * 0.005 - du_dy * nudge
          if (x[i] < 0.005) x[i] = 0.005
          if (x[i] > 0.995) x[i] = 0.995
          if (y[i] < 0.005) y[i] = 0.005
          if (y[i] > 0.995) y[i] = 0.995
        }
      }

      const colors = [
        'rgba(227, 169, 43, 0.92)',  // Saffron
        'rgba(201, 162, 126, 0.82)', // Sandstone
        'rgba(232, 224, 210, 0.95)', // Fossil
      ]

      for (let b = 0; b < 3; b++) {
        ctx.fillStyle = colors[b]
        for (let i = 0; i < count; i++) {
          if (colorBucket[i] === b) {
            ctx.fillRect(x[i] * width, y[i] * height, pSize, pSize)
          }
        }
      }
    }, [])

    const setMode = useCallback((nextN: number, nextM: number) => {
      const state = animRef.current
      if (!state) return
      if (Math.round(state.nTgt) === nextN && Math.round(state.mTgt) === nextM) return

      state.nTgt = nextN
      state.mTgt = nextM
      state.morphTime = 0
      state.morphDuration = 1.4
      state.morphBoost = 2.2

      if (prefersReducedMotion) {
        state.nCur = nextN
        state.mCur = nextM
        drawStatic()
      }
    }, [prefersReducedMotion, drawStatic])

    const shuffle = useCallback(() => {
      const state = animRef.current
      if (!state) return

      let [nextN, nextM] = getRandomMode()
      while (nextN === Math.round(state.nTgt) && nextM === Math.round(state.mTgt)) {
        ;[nextN, nextM] = getRandomMode()
      }

      setMode(nextN, nextM)
      onShuffleNotice?.()
    }, [getRandomMode, onShuffleNotice, setMode])

    const breakLayer = useCallback(() => {
      const state = animRef.current
      if (!state) return

      const crackX = 0.25 + Math.random() * 0.5
      const crackY = 0.25 + Math.random() * 0.5
      const crackAngle = (Math.random() - 0.5) * 1.8
      const cosA = Math.cos(crackAngle)
      const sinA = Math.sin(crackAngle)
      const crackLength = 0.38 + Math.random() * 0.25

      const x = state.x
      const y = state.y
      const fault = state.faultIntensity
      const count = state.count

      for (let i = 0; i < count; i++) {
        const dx = x[i] - crackX
        const dy = y[i] - crackY
        const proj = dx * cosA + dy * sinA
        const perp = Math.abs(-dx * sinA + dy * cosA)

        if (Math.abs(proj) < crackLength && perp < 0.055) {
          fault[i] = 1.2 + Math.random() * 0.6
          const sign = perp === 0 ? (Math.random() > 0.5 ? 1 : -1) : Math.sign(-dx * sinA + dy * cosA)
          x[i] += (-sinA * sign) * (0.02 + Math.random() * 0.02)
          y[i] += (cosA * sign) * (0.02 + Math.random() * 0.02)
        }
      }

      onBreakNotice?.()

      if (prefersReducedMotion) {
        drawStatic()
      }
    }, [onBreakNotice, prefersReducedMotion, drawStatic])

    useImperativeHandle(ref, () => ({ shuffle, breakLayer, setMode }), [shuffle, breakLayer, setMode])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const isMobile = window.innerWidth < 768
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      const width = Math.max(window.innerWidth, 320)
      const height = Math.max(window.innerHeight, 320)

      // Density calculation: 1 particle per 130 px² of viewport, clamped between 5k and 14k desktop, 3.5k mobile
      const rawCount = Math.floor((width * height) / 130)
      const count = isMobile ? 3500 : Math.min(Math.max(rawCount, 5000), 14000)

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)

      const ctx = canvas.getContext('2d', { alpha: true })
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      const x = new Float32Array(count)
      const y = new Float32Array(count)
      const colorBucket = new Uint8Array(count)
      const faultIntensity = new Float32Array(count)

      for (let i = 0; i < count; i++) {
        x[i] = Math.random()
        y[i] = Math.random()
        const rand = Math.random()
        if (rand < 0.62) {
          colorBucket[i] = 0 // saffron
        } else if (rand < 0.90) {
          colorBucket[i] = 1 // sandstone
        } else {
          colorBucket[i] = 2 // fossil
        }
        faultIntensity[i] = 0
      }

      const [initN, initM] = [3, 5]

      // ── Warm-up iterations (250 rounds) with gradient descent so lines exist on first paint ──
      const pi = Math.PI
      for (let step = 0; step < 260; step++) {
        for (let i = 0; i < count; i++) {
          const xi = x[i]
          const yi = y[i]
          const u =
            Math.cos(initN * pi * xi) * Math.cos(initM * pi * yi) -
            Math.cos(initM * pi * xi) * Math.cos(initN * pi * yi)
          const du_dx =
            -initN * pi * Math.sin(initN * pi * xi) * Math.cos(initM * pi * yi) +
            initM * pi * Math.sin(initM * pi * xi) * Math.cos(initN * pi * yi)
          const du_dy =
            -initM * pi * Math.cos(initN * pi * xi) * Math.sin(initM * pi * yi) +
            initN * pi * Math.cos(initM * pi * xi) * Math.sin(initN * pi * yi)
          const normSq = du_dx * du_dx + du_dy * du_dy + 0.001
          const nudge = (u / normSq) * 0.0028
          x[i] += (Math.random() - 0.5) * Math.abs(u) * 0.0045 - du_dx * nudge
          y[i] += (Math.random() - 0.5) * Math.abs(u) * 0.0045 - du_dy * nudge
          if (x[i] < 0.005) x[i] = 0.005
          if (x[i] > 0.995) x[i] = 0.995
          if (y[i] < 0.005) y[i] = 0.005
          if (y[i] > 0.995) y[i] = 0.995
        }
      }

      animRef.current = {
        running: true,
        rafId: null,
        lastTime: performance.now(),
        nCur: initN,
        mCur: initM,
        nTgt: initN,
        mTgt: initM,
        morphTime: 1.4,
        morphDuration: 1.4,
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

      if (prefersReducedMotion) {
        drawStatic()
        return
      }

      const colors = [
        'rgba(227, 169, 43, 0.92)',  // Bright saffron
        'rgba(201, 162, 126, 0.82)', // Sandstone
        'rgba(232, 224, 210, 0.95)', // Fossil
      ]
      const faultColorBase = '240, 69, 127'
      const particleSize = isMobile ? 1.6 : 1.95

      const tick = (now: number) => {
        const state = animRef.current
        if (!state || !state.running) return

        const dtRaw = (now - state.lastTime) / 1000
        state.lastTime = now
        const dt = Math.min(Math.max(dtRaw, 0.008), 0.04)

        // Performance safeguard: throttle count if frames take > 24ms
        if (dtRaw > 0.024) {
          state.slowFramesCount++
          if (state.slowFramesCount > 120 && state.throttleLevel < 2) {
            state.throttleLevel++
            state.count = Math.floor(state.count * 0.72)
            state.slowFramesCount = 0
          }
        } else {
          state.slowFramesCount = Math.max(0, state.slowFramesCount - 1)
        }

        state.time += dt

        // Morph progression
        if (state.morphTime < state.morphDuration) {
          state.morphTime += dt
          const t = Math.min(1, state.morphTime / state.morphDuration)
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
          state.nCur = state.nCur + (state.nTgt - state.nCur) * (0.045 + 0.155 * ease)
          state.mCur = state.mCur + (state.mTgt - state.mCur) * (0.045 + 0.155 * ease)
          state.morphBoost = Math.max(0, state.morphBoost - dt * 1.6)
        } else {
          state.nCur = state.nTgt
          state.mCur = state.mTgt
          state.morphBoost = 0
        }

        const idleN = state.nCur + Math.sin(state.time * 0.25) * 0.02
        const idleM = state.mCur + Math.cos(state.time * 0.20) * 0.02

        const curWidth = state.width
        const curHeight = state.height
        const curCount = state.count
        const px = state.x
        const py = state.y
        const fault = state.faultIntensity

        // Scroll velocity agitation: scale random step by 1 + min(|velocity|, 40) * 0.04
        const vel = Math.abs(getScrollVelocity())
        const velocityAgitation = 1.0 + Math.min(vel, 40) * 0.04

        const pActive = state.pointerActive
        const pNormX = state.pointerX / curWidth
        const pNormY = state.pointerY / curHeight
        const pRadiusNorm = 110 / Math.min(curWidth, curHeight)
        const pRadiusSq = pRadiusNorm * pRadiusNorm
        const pForceBase = 0.0035 + Math.min(state.pointerSpeed * 0.00008, 0.007)

        const baseStepScale = 0.0038 * (1.0 + state.morphBoost) * velocityAgitation

        if (ctx) {
          ctx.clearRect(0, 0, curWidth, curHeight)
        }

        for (let i = 0; i < curCount; i++) {
          const xi = px[i]
          const yi = py[i]

          const u =
            Math.cos(idleN * pi * xi) * Math.cos(idleM * pi * yi) -
            Math.cos(idleM * pi * xi) * Math.cos(idleN * pi * yi)

          // Gradient term along -grad u for crisp convergence
          const du_dx =
            -idleN * pi * Math.sin(idleN * pi * xi) * Math.cos(idleM * pi * yi) +
            idleM * pi * Math.sin(idleM * pi * xi) * Math.cos(idleN * pi * yi)
          const du_dy =
            -idleM * pi * Math.cos(idleN * pi * xi) * Math.sin(idleM * pi * yi) +
            idleN * pi * Math.cos(idleM * pi * xi) * Math.sin(idleN * pi * yi)
          const normSq = du_dx * du_dx + du_dy * du_dy + 0.001
          const nudge = (u / normSq) * 0.0022

          const absU = Math.abs(u)
          const stepSize = absU * baseStepScale

          let dx = (Math.random() - 0.5) * stepSize - du_dx * nudge
          let dy = (Math.random() - 0.5) * stepSize - du_dy * nudge

          // Pointer disturbance
          if (pActive) {
            const mdx = xi - pNormX
            const mdy = yi - pNormY
            const distSq = mdx * mdx + mdy * mdy
            if (distSq < pRadiusSq && distSq > 0.000001) {
              const dist = Math.sqrt(distSq)
              const pushFactor = (1.0 - dist / pRadiusNorm) * pForceBase
              dx += (mdx / dist) * pushFactor + (Math.random() - 0.5) * 0.0012
              dy += (mdy / dist) * pushFactor + (Math.random() - 0.5) * 0.0012
            }
          }

          if (fault[i] > 0) {
            fault[i] = Math.max(0, fault[i] - dt * 0.72)
            dx += (Math.random() - 0.5) * 0.0025 * fault[i]
            dy += (Math.random() - 0.5) * 0.0025 * fault[i]
          }

          let nx = xi + dx
          let ny = yi + dy

          if (nx < 0.005) nx = 0.005 + Math.random() * 0.008
          if (nx > 0.995) nx = 0.995 - Math.random() * 0.008
          if (ny < 0.005) ny = 0.005 + Math.random() * 0.008
          if (ny > 0.995) ny = 0.995 - Math.random() * 0.008

          px[i] = nx
          py[i] = ny
        }

        if (ctx) {
          const colorBucket = state.colorBucket

          // Batch regular particles by color
          for (let b = 0; b < 3; b++) {
            ctx.fillStyle = colors[b]
            for (let i = 0; i < curCount; i++) {
              if (colorBucket[i] === b && fault[i] <= 0) {
                ctx.fillRect(px[i] * curWidth, py[i] * curHeight, particleSize, particleSize)
              }
            }
          }

          // Fault fracture burst particles
          for (let i = 0; i < curCount; i++) {
            if (fault[i] > 0) {
              const alpha = Math.min(1, fault[i]) * 0.95
              ctx.fillStyle = `rgba(${faultColorBase}, ${alpha})`
              ctx.fillRect(px[i] * curWidth, py[i] * curHeight, particleSize * 1.3, particleSize * 1.3)
            }
          }
        }

        state.rafId = requestAnimationFrame(tick)
      }

      if (animRef.current) {
        animRef.current.rafId = requestAnimationFrame(tick)
      }

      // Mouse listener across entire page (canvas is fixed, so clientX/clientY map directly)
      const handleMouseMove = (e: MouseEvent) => {
        const state = animRef.current
        if (!state) return

        const clientX = e.clientX
        const clientY = e.clientY

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
      document.body.addEventListener('mouseleave', handleMouseLeave, { passive: true })

      // Visibility handling: run 60 catch-up iterations on tab re-activation
      const handleVisibilityChange = () => {
        const state = animRef.current
        if (!state) return
        if (document.hidden) {
          state.running = false
          if (state.rafId) cancelAnimationFrame(state.rafId)
        } else {
          // Catch up 60 iterations so the pattern is intact
          const c = state.count
          const xArr = state.x
          const yArr = state.y
          const curN = state.nCur
          const curM = state.mCur
          for (let step = 0; step < 60; step++) {
            for (let i = 0; i < c; i++) {
              const u =
                Math.cos(curN * pi * xArr[i]) * Math.cos(curM * pi * yArr[i]) -
                Math.cos(curM * pi * xArr[i]) * Math.cos(curN * pi * yArr[i])
              const du_dx =
                -curN * pi * Math.sin(curN * pi * xArr[i]) * Math.cos(curM * pi * yArr[i]) +
                curM * pi * Math.sin(curM * pi * xArr[i]) * Math.cos(curN * pi * yArr[i])
              const du_dy =
                -curM * pi * Math.cos(curN * pi * xArr[i]) * Math.sin(curM * pi * yArr[i]) +
                curN * pi * Math.cos(curM * pi * xArr[i]) * Math.sin(curN * pi * yArr[i])
              const normSq = du_dx * du_dx + du_dy * du_dy + 0.001
              const nudge = (u / normSq) * 0.0028
              xArr[i] += (Math.random() - 0.5) * Math.abs(u) * 0.004 - du_dx * nudge
              yArr[i] += (Math.random() - 0.5) * Math.abs(u) * 0.004 - du_dy * nudge
              if (xArr[i] < 0.005) xArr[i] = 0.005
              if (xArr[i] > 0.995) xArr[i] = 0.995
              if (yArr[i] < 0.005) yArr[i] = 0.005
              if (yArr[i] > 0.995) yArr[i] = 0.995
            }
          }
          state.running = true
          state.lastTime = performance.now()
          state.rafId = requestAnimationFrame(tick)
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true })

      let resizeTimer: ReturnType<typeof setTimeout> | null = null
      const handleResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          const state = animRef.current
          if (!canvas || !state) return
          const newWidth = Math.max(window.innerWidth, 320)
          const newHeight = Math.max(window.innerHeight, 320)

          canvas.width = Math.floor(newWidth * state.dpr)
          canvas.height = Math.floor(newHeight * state.dpr)

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

      window.addEventListener('resize', handleResize, { passive: true })

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
        if (resizeTimer) clearTimeout(resizeTimer)
      }
    }, [drawStatic, prefersReducedMotion])

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'block',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    )
  }
)
