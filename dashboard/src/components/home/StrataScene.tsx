import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Fog,
  Line,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from 'three'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { ScrollTrigger } from '../../lib/scrollFx'
import { getScrollVelocity } from '../../lib/smoothScroll'

export interface StrataSceneHandle {
  shuffle: () => void
  breakLayer: () => void
}

interface StrataSceneProps {
  onShuffleNotice?: () => void
  onBreakNotice?: () => void
}

// Color palette
const INK_HEX = 0x241a2b
const SAFFRON_HEX = 0xe3a92b
const FOSSIL_DIM_HEX = 0xa596a8
const SANDSTONE_HEX = 0xc9a27e
const FAULT_HEX = 0xf0457f

export const StrataScene = forwardRef<StrataSceneHandle, StrataSceneProps>(
  function StrataScene({ onShuffleNotice, onBreakNotice }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const prefersReducedMotion = useReducedMotion()
    const [webGlSupported, setWebGlSupported] = useState(true)

    // Animation control references
    const controlsRef = useRef<{
      triggerShuffle: () => void
      triggerBreak: () => void
      renderSingleFrame: () => void
    } | null>(null)

    const shuffle = useCallback(() => {
      controlsRef.current?.triggerShuffle()
      onShuffleNotice?.()
    }, [onShuffleNotice])

    const breakLayer = useCallback(() => {
      controlsRef.current?.triggerBreak()
      onBreakNotice?.()
    }, [onBreakNotice])

    useImperativeHandle(ref, () => ({ shuffle, breakLayer }), [shuffle, breakLayer])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      let renderer: WebGLRenderer
      try {
        renderer = new WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        })
      } catch (err) {
        console.warn('WebGL initialization failed, falling back to flat background:', err)
        setWebGlSupported(false)
        return
      }

      const isMobile = window.innerWidth < 768
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75)
      renderer.setPixelRatio(dpr)
      renderer.setSize(window.innerWidth, window.innerHeight)

      const scene = new Scene()
      const fog = new Fog(INK_HEX, 8, 38)
      scene.fog = fog

      const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100)
      camera.position.set(0, 3.4, 9)
      camera.lookAt(0, 0, -8)

      // Strata parameters
      let totalLayers = isMobile ? 16 : 30
      let pointsPerLayer = isMobile ? 160 : 320
      const xMin = -22
      const xMax = 22
      const xStep = (xMax - xMin) / (pointsPerLayer - 1)

      // Shared uniform definitions
      const sharedUniforms = {
        uTime: { value: 0 },
        uSeed: { value: Math.random() * 10 },
        uBreak: { value: 0 },
        uBreakIndex: { value: 12 },
        uCrackX: { value: (Math.random() - 0.5) * 6 },
        fogColor: { value: new Color(INK_HEX) },
        fogNear: { value: fog.near },
        fogFar: { value: fog.far },
      }

      const lineMaterials: ShaderMaterial[] = []
      const meshMaterials: ShaderMaterial[] = []
      const geometriesToDispose: BufferGeometry[] = []

      // Ridge height displacement logic for vertex shader
      const vertexDisplacementGLSL = `
        uniform float uTime;
        uniform float uSeed;
        uniform float uBreak;
        uniform float uBreakIndex;
        uniform float uCrackX;
        uniform float uLayer;
        uniform float uAmp;

        float computeHeight(float x, float layer, float t) {
          float h = uAmp * (
            sin(x * 0.35 + t * 0.25 + layer * 0.6) * 0.55 +
            sin(x * 0.90 - t * 0.40 + layer * 1.3) * 0.28 +
            sin(x * 2.10 + t * 0.60 + layer * 2.1 + uSeed) * 0.12
          );

          // Calmer in the center so headline stays crisp and readable
          float calmFactor = 0.35 + 0.65 * smoothstep(0.0, 14.0, abs(x));
          h *= calmFactor;

          // Fracture fault step for the broken layer
          float isBreak = step(abs(layer - uBreakIndex), 0.5);
          if (isBreak > 0.5 && uBreak > 0.0) {
            float stepShift = step(uCrackX, x) * 0.85;
            float crackDist = abs(x - uCrackX);
            float jitter = exp(-crackDist * 1.8) * sin(t * 35.0) * 0.35;
            h += (stepShift + jitter) * uBreak;
          }
          return h;
        }
      `

      // ── Create 30 Ridge Layers (Filled Strip Mesh + Edge Line) ──
      for (let i = 0; i < totalLayers; i++) {
        const layerZ = -i * 0.9
        const layerProgress = i / (totalLayers - 1)
        const amplitude = 0.95 + 0.55 * layerProgress

        // Line color blending: fossil-dim (far) to saffron (near), every 5th layer sandstone
        let layerColor = new Color(SAFFRON_HEX).lerp(new Color(FOSSIL_DIM_HEX), layerProgress)
        if (i % 5 === 0) {
          layerColor = new Color(SANDSTONE_HEX)
        }

        // 1. Line Geometry (top edge of ridge)
        const linePositions = new Float32Array(pointsPerLayer * 3)
        for (let j = 0; j < pointsPerLayer; j++) {
          const x = xMin + j * xStep
          linePositions[j * 3 + 0] = x
          linePositions[j * 3 + 1] = 0 // Evaluated in shader
          linePositions[j * 3 + 2] = layerZ
        }

        const lineGeo = new BufferGeometry()
        lineGeo.setAttribute('position', new BufferAttribute(linePositions, 3))
        geometriesToDispose.push(lineGeo)

        const lineMat = new ShaderMaterial({
          uniforms: {
            ...sharedUniforms,
            uLayer: { value: i },
            uAmp: { value: amplitude },
            uColor: { value: layerColor },
            uFaultColor: { value: new Color(FAULT_HEX) },
          },
          vertexShader: `
            ${vertexDisplacementGLSL}
            uniform vec3 uColor;
            uniform vec3 uFaultColor;
            varying vec3 vColor;
            varying float vFogDist;

            void main() {
              vec3 pos = position;
              pos.y = computeHeight(pos.x, uLayer, uTime);

              vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
              gl_Position = projectionMatrix * mvPos;

              vFogDist = -mvPos.z;
              float isBreak = step(abs(uLayer - uBreakIndex), 0.5);
              vColor = mix(uColor, uFaultColor, isBreak * uBreak);
            }
          `,
          fragmentShader: `
            uniform vec3 fogColor;
            uniform float fogNear;
            uniform float fogFar;
            varying vec3 vColor;
            varying float vFogDist;

            void main() {
              float fogFactor = smoothstep(fogNear, fogFar, vFogDist);
              vec3 col = mix(vColor, fogColor, fogFactor);
              gl_FragColor = vec4(col, 0.92 * (1.0 - fogFactor * 0.85));
            }
          `,
          transparent: true,
          depthTest: true,
          depthWrite: false,
        })
        lineMaterials.push(lineMat)

        const lineObj = new Line(lineGeo, lineMat)
        scene.add(lineObj)

        // 2. Filled Strip Geometry (from ridge line down to y = -6)
        // Quad strips: (top_j, bot_j, top_j+1, bot_j+1)
        const stripVertexCount = pointsPerLayer * 2
        const stripPositions = new Float32Array(stripVertexCount * 3)
        const stripIndices: number[] = []

        for (let j = 0; j < pointsPerLayer; j++) {
          const x = xMin + j * xStep
          // Top vertex
          stripPositions[j * 6 + 0] = x
          stripPositions[j * 6 + 1] = 0 // Top ridge
          stripPositions[j * 6 + 2] = layerZ
          // Bottom vertex
          stripPositions[j * 6 + 3] = x
          stripPositions[j * 6 + 4] = -6.0 // Bottom skirt
          stripPositions[j * 6 + 5] = layerZ

          if (j < pointsPerLayer - 1) {
            const topL = j * 2
            const botL = j * 2 + 1
            const topR = (j + 1) * 2
            const botR = (j + 1) * 2 + 1
            // Tri 1
            stripIndices.push(topL, botL, topR)
            // Tri 2
            stripIndices.push(topR, botL, botR)
          }
        }

        const stripGeo = new BufferGeometry()
        stripGeo.setAttribute('position', new BufferAttribute(stripPositions, 3))
        stripGeo.setIndex(stripIndices)
        geometriesToDispose.push(stripGeo)

        const meshMat = new ShaderMaterial({
          uniforms: {
            ...sharedUniforms,
            uLayer: { value: i },
            uAmp: { value: amplitude },
            uInkColor: { value: new Color(INK_HEX) },
          },
          vertexShader: `
            ${vertexDisplacementGLSL}
            varying float vFogDist;

            void main() {
              vec3 pos = position;
              // If top vertex (y > -2.0), displace with ridge height
              if (pos.y > -2.0) {
                pos.y = computeHeight(pos.x, uLayer, uTime);
              }

              vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
              gl_Position = projectionMatrix * mvPos;
              vFogDist = -mvPos.z;
            }
          `,
          fragmentShader: `
            uniform vec3 fogColor;
            uniform float fogNear;
            uniform float fogFar;
            uniform vec3 uInkColor;
            varying float vFogDist;

            void main() {
              float fogFactor = smoothstep(fogNear, fogFar, vFogDist);
              vec3 col = mix(uInkColor, fogColor, fogFactor);
              gl_FragColor = vec4(col, 1.0);
            }
          `,
          depthTest: true,
          depthWrite: true,
        })
        meshMaterials.push(meshMat)

        const stripMesh = new Mesh(stripGeo, meshMat)
        scene.add(stripMesh)
      }

      // ── Camera Keyframes along Scroll Journey ──
      // Hero (0.0), What it is (0.25), How it works (0.55), One system (0.80), CTA/Footer (1.00)
      const cameraPath = [
        { progress: 0.0, pos: new Vector3(0, 3.4, 9), target: new Vector3(0, 0, -8) },
        { progress: 0.25, pos: new Vector3(0, 6.5, 4), target: new Vector3(0, 0, -6) },
        { progress: 0.55, pos: new Vector3(0, 2.2, -4), target: new Vector3(0, 1.2, -16) },
        { progress: 0.8, pos: new Vector3(-1.2, 4.5, 2), target: new Vector3(0, 0, -10) },
        { progress: 1.0, pos: new Vector3(0, 9.0, 8), target: new Vector3(0, -1, -10) },
      ]

      let scrollProgress = 0
      const camTrigger = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: self => {
          scrollProgress = self.progress
        },
      })

      // Mouse parallax state
      let mouseX = 0
      let mouseY = 0
      let smoothMouseX = 0
      let smoothMouseY = 0

      const handleMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2
        mouseY = -(e.clientY / window.innerHeight - 0.5) * 2
      }
      window.addEventListener('mousemove', handleMouseMove, { passive: true })

      // Interpolate camera smoothly along path
      const currentCamPos = camera.position.clone()
      const currentLookAt = new Vector3(0, 0, -8)

      function updateCameraInterpolation() {
        const p = Math.min(Math.max(scrollProgress, 0), 1)

        // Find segment
        let segIdx = 0
        for (let i = 0; i < cameraPath.length - 1; i++) {
          if (p >= cameraPath[i].progress && p <= cameraPath[i + 1].progress) {
            segIdx = i
            break
          }
        }

        const segA = cameraPath[segIdx]
        const segB = cameraPath[Math.min(segIdx + 1, cameraPath.length - 1)]
        const segRange = Math.max(segB.progress - segA.progress, 0.001)
        const segT = (p - segA.progress) / segRange

        // Smooth cubic ease within segment
        const easeT = segT < 0.5 ? 4 * segT * segT * segT : 1 - Math.pow(-2 * segT + 2, 3) / 2

        const targetPos = new Vector3().lerpVectors(segA.pos, segB.pos, easeT)
        const targetLook = new Vector3().lerpVectors(segA.target, segB.target, easeT)

        // Apply mouse parallax
        smoothMouseX += (mouseX - smoothMouseX) * 0.04
        smoothMouseY += (mouseY - smoothMouseY) * 0.04

        targetPos.x += smoothMouseX * 1.2
        targetPos.y += smoothMouseY * 0.6

        // Smooth camera lerp (0.08)
        currentCamPos.lerp(targetPos, 0.08)
        currentLookAt.lerp(targetLook, 0.08)

        camera.position.copy(currentCamPos)
        camera.lookAt(currentLookAt)
      }

      // ── Interactive Controls (Reshuffle and Break Layer) ──
      let shuffleAnim: {
        active: boolean
        startSeed: number
        targetSeed: number
        elapsed: number
        duration: number
      } | null = null

      let breakAnim: {
        active: boolean
        elapsed: number
      } | null = null

      controlsRef.current = {
        triggerShuffle: () => {
          shuffleAnim = {
            active: true,
            startSeed: sharedUniforms.uSeed.value,
            targetSeed: Math.random() * 20 + 2,
            elapsed: 0,
            duration: 1.4,
          }
          if (prefersReducedMotion) {
            sharedUniforms.uSeed.value = shuffleAnim.targetSeed
            renderer.render(scene, camera)
          }
        },
        triggerBreak: () => {
          sharedUniforms.uBreakIndex.value = Math.floor(Math.random() * 8 + 8)
          sharedUniforms.uCrackX.value = (Math.random() - 0.5) * 6
          breakAnim = {
            active: true,
            elapsed: 0,
          }
          if (prefersReducedMotion) {
            sharedUniforms.uBreak.value = 1.0
            renderer.render(scene, camera)
            setTimeout(() => {
              sharedUniforms.uBreak.value = 0.0
              renderer.render(scene, camera)
            }, 1200)
          }
        },
        renderSingleFrame: () => {
          updateCameraInterpolation()
          renderer.render(scene, camera)
        },
      }

      // ── Render Loop with Performance Safeguards ──
      let rafId: number | null = null
      let isRunning = true
      let lastTime = performance.now()
      let slowFramesCount = 0
      let throttleLevel = 0

      const tick = (now: number) => {
        if (!isRunning) return

        const dtRaw = (now - lastTime) / 1000
        lastTime = now
        const dt = Math.min(Math.max(dtRaw, 0.008), 0.04)

        // Performance guard: if frames exceed 24ms for 2s, reduce layers
        if (dtRaw > 0.024) {
          slowFramesCount++
          if (slowFramesCount > 120 && throttleLevel < 2) {
            throttleLevel++
            // Remove furthest layers to protect frame rate
            const targetKeep = throttleLevel === 1 ? 20 : 14
            for (let i = targetKeep; i < totalLayers; i++) {
              if (scene.children.length > targetKeep * 2) {
                scene.remove(scene.children[scene.children.length - 1])
              }
            }
            totalLayers = targetKeep
            slowFramesCount = 0
          }
        } else {
          slowFramesCount = Math.max(0, slowFramesCount - 1)
        }

        // Advance uTime with velocity ripple
        const vel = Math.abs(getScrollVelocity())
        const velocityBoost = Math.min(vel, 40) * 0.02
        sharedUniforms.uTime.value += (0.35 + velocityBoost) * dt

        // Handle shuffle animation
        if (shuffleAnim && shuffleAnim.active) {
          shuffleAnim.elapsed += dt
          const t = Math.min(1, shuffleAnim.elapsed / shuffleAnim.duration)
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
          sharedUniforms.uSeed.value =
            shuffleAnim.startSeed + (shuffleAnim.targetSeed - shuffleAnim.startSeed) * ease
          if (t >= 1) shuffleAnim.active = false
        }

        // Handle break animation (0.5s snap, 2.0s heal)
        if (breakAnim && breakAnim.active) {
          breakAnim.elapsed += dt
          const elapsed = breakAnim.elapsed
          if (elapsed < 0.5) {
            sharedUniforms.uBreak.value = Math.min(1, elapsed / 0.5)
          } else if (elapsed < 2.5) {
            const healProgress = (elapsed - 0.5) / 2.0
            sharedUniforms.uBreak.value = Math.max(0, 1 - healProgress)
          } else {
            sharedUniforms.uBreak.value = 0
            breakAnim.active = false
          }
        }

        updateCameraInterpolation()
        renderer.render(scene, camera)

        rafId = requestAnimationFrame(tick)
      }

      if (prefersReducedMotion) {
        controlsRef.current.renderSingleFrame()
      } else {
        rafId = requestAnimationFrame(tick)
      }

      // ── Lifecycle Listeners (Resize, Visibility, Dispose) ──
      const handleVisibilityChange = () => {
        if (document.hidden) {
          isRunning = false
          if (rafId) cancelAnimationFrame(rafId)
        } else {
          isRunning = true
          lastTime = performance.now()
          if (!prefersReducedMotion) {
            rafId = requestAnimationFrame(tick)
          }
        }
      }
      document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true })

      let resizeTimer: ReturnType<typeof setTimeout> | null = null
      const handleResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          const width = window.innerWidth
          const height = window.innerHeight
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          renderer.setSize(width, height)
          if (prefersReducedMotion) {
            renderer.render(scene, camera)
          }
        }, 150)
      }
      window.addEventListener('resize', handleResize, { passive: true })

      return () => {
        isRunning = false
        if (rafId) cancelAnimationFrame(rafId)
        window.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('resize', handleResize)
        if (resizeTimer) clearTimeout(resizeTimer)
        camTrigger.kill()

        // Clean disposal of geometries, materials, and renderer
        geometriesToDispose.forEach(g => g.dispose())
        lineMaterials.forEach(m => m.dispose())
        meshMaterials.forEach(m => m.dispose())
        renderer.dispose()
      }
    }, [prefersReducedMotion])

    if (!webGlSupported) {
      return (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--ink)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )
    }

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

