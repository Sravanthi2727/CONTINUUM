import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CursorRing } from '../components/home/CursorRing'
import { HomeHeader } from '../components/home/HomeHeader'
import { ParticleField, type ParticleFieldHandle } from '../components/home/ParticleField'
import { Reveal, StaggerWords } from '../components/home/Reveal'
import { RollingCounter } from '../components/home/RollingCounter'
import { RotatingBadge } from '../components/home/RotatingBadge'
import { ScrollIndicators } from '../components/home/ScrollIndicators'
import { DEMO_VIDEO_URL, REPO_URL, TEAM_NAME } from '../config'
import type { ConnectionStatus } from '../hooks/useSocket'

interface HomePageProps {
  connectionStatus?: ConnectionStatus
}

export function HomePage({ connectionStatus = 'connected' }: HomePageProps) {
  const particleRef = useRef<ParticleFieldHandle | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (msg: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    setToastMessage(msg)
    toastTimeout.current = setTimeout(() => setToastMessage(null), 2400)
  }

  const handleShuffle = () => {
    particleRef.current?.shuffle()
    showToast('Layers reshuffled to a new standing wave')
  }

  const handleBreak = () => {
    particleRef.current?.breakLayer()
    showToast('Fault fracture triggered along nodal line')
  }

  return (
    <div
      style={{
        background: 'var(--ink)',
        color: 'var(--fossil)',
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'clip',
      }}
    >
      {/* Custom smooth cursor ring */}
      <CursorRing />

      {/* Global page scroll indicators (dashes + line) */}
      <ScrollIndicators />

      {/* Ephemeral toast notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 64,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'var(--ink-raised)',
            border: '1px solid rgba(232, 224, 210, 0.2)',
            color: 'var(--fossil)',
            padding: '6px 14px',
            borderRadius: 3,
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Slim Hero Header */}
      <HomeHeader connectionStatus={connectionStatus} />

      {/* ─── SECTION 1: HERO (FULL VIEWPORT) ───────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          height: 'calc(100vh - var(--topbar-h))',
          minHeight: 560,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 var(--sp-6)',
          overflow: 'hidden',
        }}
      >
        {/* Particle Canvas Background */}
        <ParticleField ref={particleRef} />

        {/* Center Content Box */}
        <div
          style={{
            position: 'relative',
            zIndex: 5,
            maxWidth: 820,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Headline */}
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(2.1rem, 4.3vw, 4.2rem)',
              lineHeight: 1.15,
              fontWeight: 800,
              color: 'var(--fossil)',
              letterSpacing: '-0.03em',
              marginBottom: 'var(--sp-6)',
              maxWidth: '22ch',
            }}
          >
            Sometimes the runs just match, so the broken one shows where.
          </h1>

          {/* Interactive Pill Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--sp-3)',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={handleShuffle}
              style={{
                background: 'var(--ink-raised)',
                border: '1px solid rgba(232, 224, 210, 0.22)',
                color: 'var(--fossil)',
                padding: '8px 18px',
                borderRadius: 24,
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                letterSpacing: '0.02em',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--saffron)'
                e.currentTarget.style.backgroundColor = 'rgba(227, 169, 43, 0.12)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'rgba(232, 224, 210, 0.22)'
                e.currentTarget.style.backgroundColor = 'var(--ink-raised)'
              }}
            >
              Reshuffle the layers
            </button>

            <button
              type="button"
              onClick={handleBreak}
              style={{
                background: 'var(--ink-raised)',
                border: '1px solid rgba(240, 69, 127, 0.35)',
                color: 'var(--fault)',
                padding: '8px 18px',
                borderRadius: 24,
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                letterSpacing: '0.02em',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--fault)'
                e.currentTarget.style.backgroundColor = 'rgba(240, 69, 127, 0.15)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'rgba(240, 69, 127, 0.35)'
                e.currentTarget.style.backgroundColor = 'var(--ink-raised)'
              }}
            >
              Break a layer
            </button>
          </div>
        </div>

        {/* Left Edge: Rolling Odometer Counter */}
        <div
          className="hidden md:block"
          style={{
            position: 'absolute',
            left: 36,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
          }}
        >
          <RollingCounter label="runs recorded" />
        </div>

        {/* Right Edge: Rotating Badge (Link to /projects) */}
        <div className="hidden lg:block">
          <RotatingBadge />
        </div>

        {/* Bottom Left: Built at SVNIT Surat */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 36,
            zIndex: 10,
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-body)',
            color: 'var(--fossil-dim)',
            letterSpacing: '0.04em',
          }}
        >
          Built at SVNIT Surat
        </div>

        {/* Mobile counter under hero content */}
        <div className="block md:hidden" style={{ marginTop: 'var(--sp-8)', zIndex: 10 }}>
          <RollingCounter label="runs recorded" />
        </div>
      </section>

      {/* ─── SECTION 2: WHAT IT IS ─────────────────────────────────────────── */}
      <section
        id="what-it-is"
        style={{
          maxWidth: 1140,
          margin: '0 auto',
          padding: 'var(--sp-16) var(--sp-6)',
        }}
      >
        <Reveal>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--fossil-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 'var(--sp-4)',
            }}
          >
            What it is
          </div>
        </Reveal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--sp-12)',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Heading and narrative */}
          <div>
            <StaggerWords
              as="h2"
              className="font-display"
              text="Continuum records every run, human or agent, so the next session starts with memory."
              italicWords={['records', 'memory']}
              style={{
                fontSize: 'clamp(2rem, 3.8vw, 3.4rem)',
                fontWeight: 800,
                color: 'var(--fossil)',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                marginBottom: 'var(--sp-6)',
              }}
            />

            <Reveal delay={120}>
              <p
                style={{
                  fontSize: 'var(--text-base)',
                  lineHeight: 1.65,
                  color: 'var(--fossil-dim)',
                  maxWidth: '46ch',
                }}
              >
                Developers and AI agents lose history when a build fails. CONTINUUM keeps it in MongoDB and turns it into a diagnosis: why it failed, where it diverged from the last good run, and whether it is safe to ship.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <div style={{ marginTop: 'var(--sp-6)' }}>
                <Link
                  to="/projects"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--saffron)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  <span>Explore live timeline</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Stacked Offset Screenshots */}
          <Reveal delay={100}>
            <div
              style={{
                position: 'relative',
                minHeight: 380,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Back Box: Timeline Strata */}
              <div
                style={{
                  position: 'relative',
                  width: '92%',
                  maxWidth: 440,
                  aspectRatio: '16 / 10',
                  background: 'var(--ink-raised)',
                  border: '1px solid rgba(232, 224, 210, 0.15)',
                  borderRadius: 4,
                  padding: 'var(--sp-4)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  zIndex: 2,
                }}
              >
                {/* Fallback visual preview of strata timeline */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid rgba(232, 224, 210, 0.08)', paddingBottom: 6 }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--fossil-dim)' }}>
                    public/shots/timeline.png
                  </span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--lichen)' }}>
                    LIVE STRATA
                  </span>
                </div>
                {/* Simulated strata bands */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ height: 26, background: 'rgba(169, 194, 122, 0.15)', borderLeft: '3px solid var(--sandstone)', borderRadius: 2, display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '11px', color: 'var(--fossil)' }}>
                    <span>human · git commit 9a4ef12 · 420ms</span>
                  </div>
                  <div style={{ height: 38, background: 'rgba(240, 69, 127, 0.15)', borderLeft: '3px solid var(--glacier)', borderTop: '1px dashed var(--fault)', borderRadius: 2, display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '11px', color: 'var(--fault)' }}>
                    <span>AutoDev-v2 · git commit a1b2c3d · divergence at step 3</span>
                  </div>
                  <div style={{ height: 26, background: 'rgba(169, 194, 122, 0.15)', borderLeft: '3px solid var(--sandstone)', borderRadius: 2, display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '11px', color: 'var(--fossil)' }}>
                    <span>human · npm test · 380ms</span>
                  </div>
                </div>
              </div>

              {/* Front Box: Forked Divergence Track (Rotated 1.5deg) */}
              <div
                style={{
                  position: 'absolute',
                  top: '28%',
                  right: '2%',
                  width: '88%',
                  maxWidth: 420,
                  aspectRatio: '16 / 10',
                  background: 'var(--ink-raised)',
                  border: '1px solid rgba(240, 69, 127, 0.3)',
                  borderRadius: 4,
                  padding: 'var(--sp-4)',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.65)',
                  transform: 'rotate(1.5deg)',
                  zIndex: 3,
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px solid rgba(232, 224, 210, 0.08)', paddingBottom: 6 }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--fossil-dim)' }}>
                    public/shots/fork.png
                  </span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--fault)' }}>
                    FORK TRACK
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 'calc(100% - 32px)' }}>
                  <div style={{ width: 4, height: '80%', background: 'var(--lichen)', borderRadius: 2 }} />
                  <div style={{ fontSize: '11px', color: 'var(--fossil-dim)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
                    <div style={{ color: 'var(--fault)', fontWeight: 700, marginBottom: 4 }}>
                      Step 3: Mismatched Parameter
                    </div>
                    Expected schema validation to pass. Received empty body.
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── SECTION 3: HOW IT WORKS ───────────────────────────────────────── */}
      <section
        id="how-it-works"
        style={{
          maxWidth: 1140,
          margin: '0 auto',
          padding: 'var(--sp-16) var(--sp-6)',
          borderTop: '1px solid rgba(232, 224, 210, 0.08)',
        }}
      >
        <Reveal>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--fossil-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 'var(--sp-3)',
            }}
          >
            How it works
          </div>
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3.2rem)',
              fontWeight: 800,
              color: 'var(--fossil)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--sp-12)',
            }}
          >
            From terminal command to live diagnosis.
          </h2>
        </Reveal>

        {/* Two big numbered lists side by side */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--sp-12)',
          }}
        >
          {/* List 1: Capture */}
          <div>
            <h3
              className="font-display"
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 700,
                color: 'var(--fossil)',
                marginBottom: 'var(--sp-6)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>Capture</span> runs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { num: '01', text: 'Wrap a command with cnt run' },
                { num: '02', text: 'Or let an agent report steps through MCP' },
                { num: '03', text: 'Every event gets a stable ID and a timestamp' },
                { num: '04', text: 'Duplicates and malformed events are rejected by the database' },
              ].map(item => (
                <div
                  key={item.num}
                  style={{
                    position: 'relative',
                    padding: '18px 0',
                    borderBottom: '1px solid rgba(232, 224, 210, 0.1)',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 'var(--sp-4)',
                    cursor: 'default',
                    transition: 'padding-left 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.paddingLeft = '6px'
                    const line = e.currentTarget.querySelector('.hover-line') as HTMLElement | null
                    if (line) line.style.opacity = '1'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.paddingLeft = '0px'
                    const line = e.currentTarget.querySelector('.hover-line') as HTMLElement | null
                    if (line) line.style.opacity = '0'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-lg)',
                      fontWeight: 700,
                      color: 'var(--saffron)',
                      minWidth: '2ch',
                    }}
                  >
                    {item.num}
                  </span>
                  <span style={{ fontSize: 'var(--text-base)', color: 'var(--fossil)', lineHeight: 1.5 }}>
                    {item.text}
                  </span>
                  <div
                    className="hover-line"
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      left: 0,
                      right: 0,
                      height: 1,
                      backgroundColor: 'var(--saffron)',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* List 2: Diagnose */}
          <div>
            <h3
              className="font-display"
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 700,
                color: 'var(--fossil)',
                marginBottom: 'var(--sp-6)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>Diagnose</span> failures
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { num: '01', text: 'Compare a failed run with the last good one, step by step' },
                { num: '02', text: 'Find the first step where they split' },
                { num: '03', text: 'Tell flaky tests from real regressions' },
                { num: '04', text: 'Surface similar past failures and give a verdict: safe, risky, or blocked' },
              ].map(item => (
                <div
                  key={item.num}
                  style={{
                    position: 'relative',
                    padding: '18px 0',
                    borderBottom: '1px solid rgba(232, 224, 210, 0.1)',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 'var(--sp-4)',
                    cursor: 'default',
                    transition: 'padding-left 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.paddingLeft = '6px'
                    const line = e.currentTarget.querySelector('.hover-line') as HTMLElement | null
                    if (line) line.style.opacity = '1'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.paddingLeft = '0px'
                    const line = e.currentTarget.querySelector('.hover-line') as HTMLElement | null
                    if (line) line.style.opacity = '0'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-lg)',
                      fontWeight: 700,
                      color: 'var(--lichen)',
                      minWidth: '2ch',
                    }}
                  >
                    {item.num}
                  </span>
                  <span style={{ fontSize: 'var(--text-base)', color: 'var(--fossil)', lineHeight: 1.5 }}>
                    {item.text}
                  </span>
                  <div
                    className="hover-line"
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      left: 0,
                      right: 0,
                      height: 1,
                      backgroundColor: 'var(--lichen)',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: ONE SYSTEM (MONGODB ARGUMENT) ──────────────────────── */}
      <section
        id="one-system"
        style={{
          maxWidth: 1140,
          margin: '0 auto',
          padding: 'var(--sp-16) var(--sp-6)',
          borderTop: '1px solid rgba(232, 224, 210, 0.08)',
        }}
      >
        <Reveal>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--fossil-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 'var(--sp-3)',
            }}
          >
            One system
          </div>
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3.2rem)',
              fontWeight: 800,
              color: 'var(--fossil)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--sp-10)',
            }}
          >
            Simplicity by architecture.
          </h2>
        </Reveal>

        {/* Wide Table-like List */}
        <Reveal delay={120}>
          <div
            style={{
              width: '100%',
              borderTop: '1px solid rgba(232, 224, 210, 0.15)',
              marginBottom: 'var(--sp-10)',
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.2fr 1fr',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(232, 224, 210, 0.15)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--fossil-dim)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              <div>Need</div>
              <div>Usually needs</div>
              <div>Here</div>
            </div>

            {/* Rows */}
            {[
              {
                need: 'No duplicate events',
                usually: 'a Redis cache',
                here: 'a unique _id',
              },
              {
                need: 'Valid events, flexible payload',
                usually: 'validation middleware',
                here: '$jsonSchema validator',
              },
              {
                need: 'Compare runs',
                usually: 'loops in app code',
                here: 'an aggregation pipeline',
              },
              {
                need: 'Live updates',
                usually: 'Kafka or pub/sub',
                here: 'change streams',
              },
            ].map(row => (
              <div
                key={row.need}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1.2fr 1fr',
                  padding: '18px 16px',
                  borderBottom: '1px solid rgba(232, 224, 210, 0.08)',
                  alignItems: 'baseline',
                }}
              >
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fossil)', fontWeight: 600 }}>
                  {row.need}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--fossil-dim)',
                    textDecoration: 'line-through',
                    opacity: 0.65,
                  }}
                >
                  {row.usually}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--lichen)',
                    fontWeight: 700,
                  }}
                >
                  {row.here}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Closing line */}
        <Reveal delay={200}>
          <div
            className="font-display"
            style={{
              fontSize: 'clamp(1.8rem, 3.2vw, 2.8rem)',
              fontWeight: 800,
              color: 'var(--fossil)',
              letterSpacing: '-0.02em',
            }}
          >
            Four problems. One database.
          </div>
        </Reveal>
      </section>

      {/* ─── SECTION 5: CALL TO ACTION AND FOOTER ─────────────────────────── */}
      <section
        id="cta"
        style={{
          maxWidth: 1140,
          margin: '0 auto',
          padding: 'var(--sp-16) var(--sp-6) var(--sp-12)',
          borderTop: '1px solid rgba(232, 224, 210, 0.08)',
        }}
      >
        <Reveal>
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 4.4rem)',
              fontWeight: 800,
              color: 'var(--fossil)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: 'var(--sp-8)',
              maxWidth: '18ch',
            }}
          >
            See a failure find its own fork.
          </h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-5)',
              flexWrap: 'wrap',
              marginBottom: 'var(--sp-16)',
            }}
          >
            <Link
              to="/projects"
              style={{
                display: 'inline-block',
                background: 'var(--saffron)',
                color: 'var(--ink)',
                padding: '12px 28px',
                borderRadius: 3,
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                letterSpacing: '0.02em',
                textDecoration: 'none',
                transition: 'opacity 0.15s ease',
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={e => (e.currentTarget.style.opacity = '1')}
            >
              Open the dashboard
            </Link>

            <a
              href={DEMO_VIDEO_URL}
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--fossil-dim)',
                textDecoration: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'color 0.15s ease',
              }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--fossil)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--fossil-dim)')}
            >
              Watch the demo video
            </a>
          </div>
        </Reveal>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid rgba(232, 224, 210, 0.12)',
            paddingTop: 'var(--sp-8)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-6)',
          }}
        >
          {/* Centered end mark */}
          <div
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--fossil-dim)',
              letterSpacing: '0.2em',
            }}
          >
            the end ✧
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--sp-4)',
            }}
          >
            {/* Team line */}
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
              Built by Team {TEAM_NAME} at SVNIT Surat
            </div>

            {/* Footer Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-6)' }}>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--fossil-dim)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
                onMouseOver={e => (e.currentTarget.style.color = 'var(--fossil)')}
                onMouseOut={e => (e.currentTarget.style.color = 'var(--fossil-dim)')}
              >
                GitHub
              </a>

              <Link
                to="/docs"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--fossil-dim)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
                onMouseOver={e => (e.currentTarget.style.color = 'var(--fossil)')}
                onMouseOut={e => (e.currentTarget.style.color = 'var(--fossil-dim)')}
              >
                Docs (CNT CLI)
              </Link>

              <Link
                to="/projects"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--saffron)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}
              >
                Dashboard &rarr;
              </Link>
            </div>
          </div>
        </footer>
      </section>
    </div>
  )
}
