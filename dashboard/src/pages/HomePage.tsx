import { Link } from 'react-router-dom'

// ─── Feature entry ────────────────────────────────────────────────────────────

interface Feature {
  num: string
  title: string
  body: string
  tag?: string
}

const FEATURES: Feature[] = [
  {
    num: '01',
    title: 'Every run. Every agent. One memory.',
    body: 'CONTINUUM captures every build, test, and deploy — whether you typed it or an AI agent did — into MongoDB. Human and agent runs share the same timeline, the same history, the same truth.',
    tag: 'Core',
  },
  {
    num: '02',
    title: 'Live timeline as strata bands.',
    body: 'Runs stack like sediment layers, newest first. Band height reflects duration. Failed runs fracture at the top edge. Source is colour-coded on the left rail — sandstone for human, glacier for agent. New runs push in live over a Socket.IO connection.',
    tag: 'Timeline',
  },
  {
    num: '03',
    title: 'Why it failed — not just that it failed.',
    body: 'The divergence panel draws a forked track: a shared spine that splits at the first mismatched step. One path in lichen green for the last good run, one in fault pink for this one. The fork point carries the explanation text.',
    tag: 'Run detail',
  },
  {
    num: '04',
    title: 'A verdict stamp, not a status dot.',
    body: 'Safe, Risky, or Blocked. Rendered as a large rotated stamp in the display font — the one element you remember after a three-second glance. It updates live when a running run finishes.',
    tag: 'Run detail',
  },
  {
    num: '05',
    title: 'Similar failures as a depth scale.',
    body: 'Past failures positioned on a vertical ruler proportional to their vector similarity — 91%, 84%, 72%. Closer to the top means closer match. No percentage bars, no tables. Just depth and proximity.',
    tag: 'Analysis',
  },
  {
    num: '06',
    title: 'Flaky vs regression. One clear verdict.',
    body: 'The analysis pipeline groups test failures by run. A test that fails 4 out of 10 times is flaky. A test that never failed before is a regression. The panel shows the verdict and the rate.',
    tag: 'Analysis',
  },
  {
    num: '07',
    title: 'Dedup enforced at the DB, shown in the UI.',
    body: 'Send an event twice — MongoDB\'s unique index rejects the second write instantly. The demo drawer fires both the happy path and the duplicate on stage, and the toast reads exactly why it was blocked.',
    tag: 'Demo',
  },
  {
    num: '08',
    title: 'Schema validation with a readable error.',
    body: 'Send an event missing run_id and the $jsonSchema validator catches it before any application code runs. The toast surfaces the field name and the server\'s error details — no vague "bad request".',
    tag: 'Demo',
  },
  {
    num: '09',
    title: 'Mock-first. Real API is one env change.',
    body: 'VITE_USE_MOCKS=true runs the whole dashboard on local mock data and a simulated socket. Flip it to false, point VITE_API_URL at the backend, and nothing else changes.',
    tag: 'Architecture',
  },
  {
    num: '10',
    title: 'Demo controls on stage.',
    body: 'A collapsible drawer in the bottom right. Five buttons: start an agent run, start a human run, trigger divergence, send a duplicate, send a malformed event. No terminal required during the presentation.',
    tag: 'Demo',
  },
]

const TAG_COLORS: Record<string, string> = {
  Core:         'var(--fossil-dim)',
  Timeline:     'var(--lichen)',
  'Run detail': 'var(--saffron)',
  Analysis:     'var(--glacier)',
  Demo:         'var(--fault)',
  Architecture: 'var(--sandstone)',
}

// ─── Animated strata strip ────────────────────────────────────────────────────

function HeroStrataStrip() {
  const slices = [
    { color: 'var(--lichen)',  w: '18%' },
    { color: 'var(--lichen)',  w: '8%'  },
    { color: 'var(--fault)',   w: '14%' },
    { color: 'var(--lichen)',  w: '22%' },
    { color: 'var(--saffron)', w: '10%' },
    { color: 'var(--lichen)',  w: '16%' },
    { color: 'var(--fault)',   w: '12%' },
  ]

  return (
    <div
      aria-hidden
      style={{
        display: 'flex',
        width: '100%',
        height: 6,
        gap: 2,
        marginTop: 'var(--sp-8)',
        marginBottom: 'var(--sp-8)',
      }}
    >
      {slices.map((s, i) => (
        <div
          key={i}
          style={{
            width: s.w,
            height: '100%',
            background: s.color,
            opacity: 0.7,
            animation: `strata-settle 0.6s ${i * 80}ms cubic-bezier(0.22,1,0.36,1) both`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HomePage() {
  return (
    <main
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: 'var(--sp-12) var(--sp-6) var(--sp-16)',
      }}
    >
      {/* Hero ---------------------------------------------------------------- */}
      <section style={{ marginBottom: 'var(--sp-16)' }}>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--fossil-dim)',
            marginBottom: 'var(--sp-4)',
            letterSpacing: '0.04em',
          }}
        >
          UNCHARTED 2026 — Track 3: Developer Tools
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            color: 'var(--fossil)',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            marginBottom: 'var(--sp-6)',
            maxWidth: '14ch',
          }}
        >
          Memory that outlives the session.
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-lg)',
            color: 'var(--fossil-dim)',
            lineHeight: 1.65,
            maxWidth: '58ch',
            marginBottom: 'var(--sp-8)',
          }}
        >
          CONTINUUM captures every build, test, and deploy run — human or agent —
          into MongoDB. It turns that history into live diagnoses: why a run failed,
          whether a change is safe to ship, and which past failures look similar.
        </p>

        <HeroStrataStrip />

        <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
          <Link
            to="/projects/proj_alpha"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: 'var(--fossil)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            Open timeline
          </Link>
          <Link
            to="/projects"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--fossil-dim)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 'var(--text-sm)',
              textDecoration: 'none',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = 'var(--fossil-dim)'
              e.currentTarget.style.color = 'var(--fossil)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
              e.currentTarget.style.color = 'var(--fossil-dim)'
            }}
          >
            All projects
          </Link>
          <Link
            to="/docs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              border: '1px solid var(--saffron)',
              color: 'var(--saffron)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(227, 169, 43, 0.1)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <span>Documentation & CNT</span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', background: 'var(--saffron)', color: 'var(--ink)', padding: '1px 5px', borderRadius: 2, fontWeight: 700 }}>
              GUIDE
            </span>
          </Link>
        </div>
      </section>

      {/* Core question ------------------------------------------------------- */}
      <section style={{ marginBottom: 'var(--sp-16)' }}>
        <div
          style={{
            borderLeft: '3px solid var(--saffron)',
            paddingLeft: 'var(--sp-5)',
            paddingTop: 'var(--sp-2)',
            paddingBottom: 'var(--sp-2)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'var(--text-2xl)',
              color: 'var(--fossil)',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              maxWidth: '48ch',
            }}
          >
            "Why did this run fail,<br />and is it safe to ship?"
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fossil-dim)', marginTop: 'var(--sp-3)' }}>
            That's the core question CONTINUUM answers. Every other feature exists to serve it.
          </p>
        </div>
      </section>

      {/* Feature list -------------------------------------------------------- */}
      <section>
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--fossil-dim)',
            letterSpacing: '0.08em',
            marginBottom: 'var(--sp-8)',
          }}
        >
          WHAT WAS BUILT
        </p>

        <div
          role="list"
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.num}
              role="listitem"
              style={{
                display: 'grid',
                gridTemplateColumns: '52px 1fr auto',
                gap: 'var(--sp-5)',
                padding: 'var(--sp-6) 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                alignItems: 'start',
                animation: `strata-settle 0.5s ${i * 45}ms cubic-bezier(0.22,1,0.36,1) both`,
              }}
            >
              {/* Number */}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--fossil-dim)',
                  paddingTop: 4,
                  opacity: 0.5,
                }}
              >
                {f.num}
              </span>

              {/* Content */}
              <div>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 'var(--text-xl)',
                    color: 'var(--fossil)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    marginBottom: 'var(--sp-2)',
                  }}
                >
                  {f.title}
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--fossil-dim)',
                    lineHeight: 1.7,
                    maxWidth: '60ch',
                  }}
                >
                  {f.body}
                </p>
              </div>

              {/* Tag */}
              {f.tag && (
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-xs)',
                    color: TAG_COLORS[f.tag] ?? 'var(--fossil-dim)',
                    whiteSpace: 'nowrap',
                    paddingTop: 5,
                    opacity: 0.8,
                  }}
                >
                  {f.tag}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* MongoDB pitch ------------------------------------------------------- */}
      <section style={{ marginTop: 'var(--sp-16)', marginBottom: 'var(--sp-16)' }}>
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--fossil-dim)',
            letterSpacing: '0.08em',
            marginBottom: 'var(--sp-6)',
          }}
        >
          WHY MONGODB
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {[
            { need: 'Dedup events',      without: 'Redis cache + manual check in every write path', with: 'Unique index on _id — one line, enforced at DB level' },
            { need: 'Validate payloads', without: 'Custom middleware per endpoint',                  with: '$jsonSchema validator on the collection — automatic, zero app code' },
            { need: 'Detect flakiness',  without: 'Pull all docs into memory, group and loop',       with: '$group / $match aggregation pipeline — computed inside the DB' },
            { need: 'Live dashboard',    without: 'Separate pub/sub layer (Kafka, Redis)',            with: 'db.collection.watch() — Change Streams built in' },
            { need: 'Match failures',    without: 'Separate vector DB (Pinecone) + sync pipeline',   with: 'Atlas Vector Search — embeddings live next to structured data' },
          ].map((row, i) => (
            <div
              key={row.need}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr 1fr',
                gap: 'var(--sp-4)',
                padding: 'var(--sp-4) 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                alignItems: 'start',
                animation: `strata-settle 0.5s ${i * 50}ms cubic-bezier(0.22,1,0.36,1) both`,
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil)', fontWeight: 600, paddingTop: 2 }}>
                {row.need}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.6, opacity: 0.6 }}>
                {row.without}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--lichen)', lineHeight: 1.6 }}>
                {row.with}
              </span>
            </div>
          ))}
        </div>

        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 'var(--text-lg)',
            color: 'var(--fossil)',
            marginTop: 'var(--sp-8)',
            maxWidth: '60ch',
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
          }}
        >
          Everything here would normally require 3–4 separate pieces of infrastructure
          stitched together. MongoDB does it as one system — that's the actual argument.
        </p>
      </section>

      {/* CTA ----------------------------------------------------------------- */}
      <section
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 'var(--sp-10)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 'var(--sp-6)',
        }}
      >
        <div>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'var(--text-2xl)',
              color: 'var(--fossil)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: 'var(--sp-3)',
            }}
          >
            See it running.
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fossil-dim)' }}>
            Open the timeline, click a failed run, and watch the fork track explain the failure.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <Link
            to="/projects/proj_alpha"
            style={{
              padding: '10px 24px',
              background: 'var(--fossil)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              textDecoration: 'none',
            }}
          >
            atlas-sync timeline
          </Link>
          <Link
            to={`/runs/run_failed_01`}
            style={{
              padding: '10px 24px',
              border: '1px solid var(--fault)',
              color: 'var(--fault)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 'var(--text-sm)',
              textDecoration: 'none',
            }}
          >
            View failed run
          </Link>
        </div>
      </section>
    </main>
  )
}
