import { useState } from 'react'
import { Link } from 'react-router-dom'

interface CodeSnippetProps {
  code: string
  language?: string
  caption?: string
}

function CodeSnippet({ code, language = 'bash', caption }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        background: 'var(--ink-raised)',
        border: '1px solid rgba(232, 224, 210, 0.12)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 'var(--sp-4)',
      }}
    >
      {caption && (
        <div
          style={{
            padding: '6px 12px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid rgba(232, 224, 210, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--fossil-dim)',
          }}
        >
          <span>{caption}</span>
          <span style={{ textTransform: 'uppercase', fontSize: '9px', opacity: 0.6 }}>{language}</span>
        </div>
      )}
      <div style={{ position: 'relative', padding: '12px 16px' }}>
        <button
          onClick={handleCopy}
          aria-label="Copy code"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: copied ? 'var(--lichen)' : 'rgba(232, 224, 210, 0.08)',
            color: copied ? 'var(--ink)' : 'var(--fossil-dim)',
            border: '1px solid rgba(232, 224, 210, 0.15)',
            padding: '3px 8px',
            borderRadius: 3,
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontWeight: 600,
          }}
        >
          {copied ? '✓ COPIED' : 'COPY'}
        </button>
        <pre
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--fossil)',
            lineHeight: 1.6,
            overflowX: 'auto',
            margin: 0,
            paddingRight: 60,
          }}
        >
          {code}
        </pre>
      </div>
    </div>
  )
}

export function DocsPage() {
  const [activeSection, setActiveSection] = useState<'all' | 'cnt' | 'dashboard' | 'mcp' | 'arch'>('all')

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: 'var(--sp-8) var(--sp-6) var(--sp-16)',
      }}
    >
      {/* Breadcrumb & Header */}
      <div style={{ marginBottom: 'var(--sp-8)' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--saffron)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 'var(--sp-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Link to="/" style={{ color: 'var(--fossil-dim)', textDecoration: 'none' }}>CONTINUUM</Link>
          <span>/</span>
          <span>SYSTEM DOCUMENTATION & USER MANUAL</span>
        </div>
        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            color: 'var(--fossil)',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 'var(--sp-3)',
          }}
        >
          CONTINUUM Documentation
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--fossil-dim)',
            lineHeight: 1.6,
            maxWidth: '65ch',
          }}
        >
          Complete guide to the CONTINUUM telemetry intelligence platform, including comprehensive coverage of the{' '}
          <strong style={{ color: 'var(--saffron)' }}>cnt</strong> CLI tool, live strata dashboard, divergence tracking, and AI agent integration.
        </p>

        {/* Quick jump pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--sp-2)',
            marginTop: 'var(--sp-6)',
            paddingTop: 'var(--sp-4)',
            borderTop: '1px solid rgba(232, 224, 210, 0.08)',
          }}
        >
          <button
            onClick={() => setActiveSection('all')}
            style={{
              padding: '6px 12px',
              borderRadius: 3,
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              background: activeSection === 'all' ? 'var(--fossil)' : 'var(--ink-raised)',
              color: activeSection === 'all' ? 'var(--ink)' : 'var(--fossil-dim)',
              border: '1px solid rgba(232, 224, 210, 0.15)',
              fontWeight: 600,
            }}
          >
            All Sections
          </button>
          <button
            onClick={() => setActiveSection('cnt')}
            style={{
              padding: '6px 12px',
              borderRadius: 3,
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              background: activeSection === 'cnt' ? 'var(--saffron)' : 'var(--ink-raised)',
              color: activeSection === 'cnt' ? 'var(--ink)' : 'var(--saffron)',
              border: '1px solid var(--saffron)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>⚡ The CNT CLI</span>
            <span style={{ fontSize: '9px', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: 2 }}>CORE</span>
          </button>
          <button
            onClick={() => setActiveSection('dashboard')}
            style={{
              padding: '6px 12px',
              borderRadius: 3,
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              background: activeSection === 'dashboard' ? 'var(--lichen)' : 'var(--ink-raised)',
              color: activeSection === 'dashboard' ? 'var(--ink)' : 'var(--lichen)',
              border: '1px solid rgba(169, 194, 122, 0.4)',
              fontWeight: 600,
            }}
          >
            📊 Dashboard Guide
          </button>
          <button
            onClick={() => setActiveSection('mcp')}
            style={{
              padding: '6px 12px',
              borderRadius: 3,
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              background: activeSection === 'mcp' ? 'var(--glacier)' : 'var(--ink-raised)',
              color: activeSection === 'mcp' ? 'var(--ink)' : 'var(--glacier)',
              border: '1px solid rgba(127, 209, 193, 0.4)',
              fontWeight: 600,
            }}
          >
            🤖 AI Agents & MCP
          </button>
          <button
            onClick={() => setActiveSection('arch')}
            style={{
              padding: '6px 12px',
              borderRadius: 3,
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              background: activeSection === 'arch' ? 'var(--sandstone)' : 'var(--ink-raised)',
              color: activeSection === 'arch' ? 'var(--ink)' : 'var(--sandstone)',
              border: '1px solid rgba(201, 162, 126, 0.4)',
              fontWeight: 600,
            }}
          >
            ⚙️ System Architecture
          </button>
        </div>
      </div>

      {/* ─── SECTION 1: CNT CLI (HIGH PRIORITY / DETAILED) ─────────────────── */}
      {(activeSection === 'all' || activeSection === 'cnt') && (
        <section
          id="cnt-cli"
          style={{
            marginBottom: 'var(--sp-12)',
            padding: 'var(--sp-6)',
            background: 'rgba(227, 169, 43, 0.03)',
            border: '1px solid rgba(227, 169, 43, 0.3)',
            borderRadius: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--sp-3)' }}>
            <span
              style={{
                background: 'var(--saffron)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 2,
              }}
            >
              CORE COMPONENT
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
              @continuum/cli — Command Line Engine
            </span>
          </div>

          <h2
            className="font-display"
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 800,
              color: 'var(--fossil)',
              marginBottom: 'var(--sp-3)',
            }}
          >
            The CNT CLI (<code style={{ color: 'var(--saffron)', fontFamily: 'var(--font-mono)' }}>cnt</code>)
          </h2>

          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--fossil)',
              lineHeight: 1.7,
              marginBottom: 'var(--sp-4)',
            }}
          >
            <strong>CNT</strong> is the official command-line interface that powers CONTINUUM. While terminal commands are usually ephemeral and lost when a shell session ends, <code style={{ color: 'var(--saffron)' }}>cnt</code> acts as a universal execution wrapper. It captures run telemetry, intercepts stdout/stderr streams, records exit codes, and syncs execution events directly to CONTINUUM’s MongoDB database in real time.
          </p>

          <div
            style={{
              background: 'var(--ink-raised)',
              borderLeft: '3px solid var(--saffron)',
              padding: 'var(--sp-4)',
              borderRadius: 3,
              marginBottom: 'var(--sp-6)',
              fontSize: 'var(--text-xs)',
              lineHeight: 1.6,
            }}
          >
            <div style={{ color: 'var(--saffron)', fontWeight: 700, marginBottom: 4 }}>
              WHY CNT IS CRUCIAL
            </div>
            <p style={{ color: 'var(--fossil-dim)', margin: 0 }}>
              Both human engineers and autonomous AI agents (via Cursor, Claude Code, etc.) execute tests, builds, and migrations through terminal shells. By prefixing any command with <code style={{ color: 'var(--fossil)' }}>cnt run</code>, runs are automatically attributed, versioned by commit SHA, matched against historical baselines, and evaluated for divergence or regressions.
            </p>
          </div>

          {/* Installation */}
          <h3
            className="font-display"
            style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fossil)', marginBottom: 'var(--sp-2)' }}
          >
            1. Installation & Binary Setup
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fossil-dim)', marginBottom: 'var(--sp-2)' }}>
            The CLI is distributed as <code style={{ color: 'var(--fossil)' }}>@continuum/cli</code> and installs the global executable <code style={{ color: 'var(--saffron)' }}>cnt</code>:
          </p>
          <CodeSnippet
            caption="Installation via npm or local linking"
            code={`# Install globally
npm install -g @continuum/cli

# Verify installation
cnt --help`}
          />

          {/* Commands Breakdown */}
          <h3
            className="font-display"
            style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fossil)', marginTop: 'var(--sp-6)', marginBottom: 'var(--sp-2)' }}
          >
            2. Core Commands Reference
          </h3>

          {/* cnt init */}
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            <h4
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                color: 'var(--lichen)',
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              cnt init [options]
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.6, marginBottom: 8 }}>
              Initializes CONTINUUM in the current repository, registers the project in the API, and creates a local <code style={{ color: 'var(--fossil)' }}>.continuum.json</code> config file.
            </p>
            <CodeSnippet
              caption="Register current directory as a CONTINUUM project"
              code={`# Initialize using current directory name
cnt init

# Initialize with custom project name and git repo URL
cnt init -n "order-service" -r "https://github.com/org/order-service"`}
            />
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: 3 }}>
              <strong>Generates <code style={{ color: 'var(--fossil)' }}>.continuum.json</code>:</strong>
              <code style={{ display: 'block', marginTop: 4, color: 'var(--fossil)' }}>
                {`{ "project_id": "proj_a89bc21", "project_name": "order-service" }`}
              </code>
            </div>
          </div>

          {/* cnt run */}
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            <h4
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                color: 'var(--saffron)',
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              cnt run &lt;command&gt; [--commit &lt;sha&gt;]
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.6, marginBottom: 8 }}>
              The central workflow tool. Wraps any build or test command, intercepts child process execution, logs structured lifecycle events, and prints a live diagnosis link.
            </p>
            <CodeSnippet
              caption="Wrapping test suites and build scripts"
              code={`# Wrap Node.js / Jest / Vitest test run
cnt run "npm test"

# Wrap Python pytest execution
cnt run "pytest tests/ --maxfail=1"

# Wrap production build with explicit commit SHA
cnt run "npm run build" --commit "8fa21e4"

# Wrap Rust cargo test
cnt run "cargo test"`}
            />

            {/* Execution lifecycle */}
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(232, 224, 210, 0.08)',
                padding: 'var(--sp-4)',
                borderRadius: 4,
                marginTop: 8,
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fossil)', marginBottom: 8 }}>
                HOW <code style={{ color: 'var(--saffron)' }}>cnt run</code> WORKS INTERNALLY:
              </div>
              <ol style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                <li><strong>Creates Run:</strong> Calls <code style={{ color: 'var(--fossil)' }}>POST /runs</code> with project ID, operator, commit SHA, and task description.</li>
                <li><strong>Logs Initial Event:</strong> Emits <code style={{ color: 'var(--fossil)' }}>command_run</code> (step 0) with the raw command string.</li>
                <li><strong>Sandboxed Execution:</strong> Spawns the child process, capturing stdout and stderr without modifying exit codes.</li>
                <li><strong>Success/Failure Branch:</strong>
                  <ul style={{ marginTop: 4 }}>
                    <li>If exit code == 0: Emits <code style={{ color: 'var(--lichen)' }}>test_result</code> with execution duration and marks run status as <code style={{ color: 'var(--lichen)' }}>success</code>.</li>
                    <li>If exit code != 0: Emits <code style={{ color: 'var(--fault)' }}>error</code> with stderr traceback and marks run status as <code style={{ color: 'var(--fault)' }}>failed</code>.</li>
                  </ul>
                </li>
                <li><strong>Live URL Output:</strong> Outputs the direct URL to inspect the run and its divergence analysis on the dashboard.</li>
              </ol>
            </div>
          </div>

          {/* cnt history */}
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            <h4
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                color: 'var(--glacier)',
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              cnt history [-n, --limit &lt;number&gt;]
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.6, marginBottom: 8 }}>
              Queries the CONTINUUM backend and prints the last N runs in a readable terminal strata table.
            </p>
            <CodeSnippet
              caption="Terminal output of cnt history"
              code={`$ cnt history -n 5

📜 Last 5 runs for: order-service

STATUS   | SOURCE | STARTED              | COMMIT     | RUN ID
--------------------------------------------------------------------------------
✅ ok    | human  | 10/31/2026, 3:30 PM  | 9a4ef12    | run_9a4ef12_pass
❌ fail  | agent  | 10/31/2026, 3:34 PM  | a1b2c3d    | run_failed_01
✅ ok    | human  | 10/31/2026, 3:38 PM  | c5d6e7f    | run_c5d6e7f_pass
✅ ok    | agent  | 10/31/2026, 3:42 PM  | d8e9f01    | run_d8e9f01_pass
🔄 run   | agent  | 10/31/2026, 3:45 PM  | e2f3a4b    | run_e2f3a4b_live`}
            />
          </div>

          {/* cnt link-agent */}
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <h4
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                color: 'var(--sandstone)',
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              cnt link-agent [-t, --token &lt;jwt_token&gt;]
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.6, marginBottom: 8 }}>
              Generates ready-to-use Model Context Protocol (MCP) configuration so your AI coding agents (Cursor, Claude Code, GitHub Copilot) can query CONTINUUM directly.
            </p>
            <CodeSnippet
              caption="Generate MCP config snippet"
              code={`# Generate scoped config with your authentication token
cnt link-agent -t "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`}
            />
          </div>

          {/* Environment variables */}
          <div
            style={{
              background: 'var(--ink-raised)',
              border: '1px solid rgba(232, 224, 210, 0.1)',
              padding: 'var(--sp-4)',
              borderRadius: 4,
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fossil)', marginBottom: 6 }}>
              CNT ENVIRONMENT VARIABLES
            </div>
            <ul style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.8, margin: 0, paddingLeft: 16 }}>
              <li><code style={{ color: 'var(--fossil)' }}>CONTINUUM_API_URL</code>: Base URL of the CONTINUUM Express ingestion API (defaults to <code style={{ color: 'var(--glacier)' }}>https://continuum-api-rkp4.onrender.com</code>).</li>
              <li><code style={{ color: 'var(--fossil)' }}>USER</code>: System operator username automatically logged into the <code style={{ color: 'var(--fossil)' }}>triggered_by</code> field.</li>
            </ul>
          </div>
        </section>
      )}

      {/* ─── SECTION 2: WEB DASHBOARD USER GUIDE ───────────────────────────── */}
      {(activeSection === 'all' || activeSection === 'dashboard') && (
        <section
          id="dashboard-guide"
          style={{
            marginBottom: 'var(--sp-12)',
            padding: 'var(--sp-6)',
            background: 'rgba(169, 194, 122, 0.03)',
            border: '1px solid rgba(169, 194, 122, 0.3)',
            borderRadius: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--sp-3)' }}>
            <span
              style={{
                background: 'var(--lichen)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 2,
              }}
            >
              UI GUIDE
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
              "Core Sample" Geological Visual System
            </span>
          </div>

          <h2
            className="font-display"
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 800,
              color: 'var(--fossil)',
              marginBottom: 'var(--sp-3)',
            }}
          >
            Web Dashboard User Guide
          </h2>

          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--fossil)',
              lineHeight: 1.7,
              marginBottom: 'var(--sp-6)',
            }}
          >
            CONTINUUM departs from generic SaaS dashboard tables and cards. It treats software execution history as <strong>geological strata</strong> — layers of sediment representing builds over time.
          </p>

          {/* Page by Page breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            {/* Projects Page */}
            <div
              style={{
                background: 'var(--ink-raised)',
                border: '1px solid rgba(232, 224, 210, 0.1)',
                padding: 'var(--sp-5)',
                borderRadius: 4,
              }}
            >
              <h3
                className="font-display"
                style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fossil)', marginBottom: 8 }}
              >
                1. Projects List (<code style={{ color: 'var(--lichen)' }}>/projects</code>)
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.6, marginBottom: 12 }}>
                Displays all active projects. Rather than traditional paginated tables, each project row features a <strong>Mini Strata Strip</strong> representing the last 12 runs:
              </p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', fontFamily: 'var(--font-mono)' }}>
                  Strata Colors:
                </span>
                <span style={{ background: 'var(--lichen)', color: 'var(--ink)', padding: '2px 6px', borderRadius: 2, fontSize: '10px', fontWeight: 700 }}>
                  Lichen = Success
                </span>
                <span style={{ background: 'var(--saffron)', color: 'var(--ink)', padding: '2px 6px', borderRadius: 2, fontSize: '10px', fontWeight: 700 }}>
                  Saffron = In Progress
                </span>
                <span style={{ background: 'var(--fault)', color: 'white', padding: '2px 6px', borderRadius: 2, fontSize: '10px', fontWeight: 700 }}>
                  Fault Pink = Failed
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', margin: 0 }}>
                Clicking any project row seamlessly drills into that project's geological timeline.
              </p>
            </div>

            {/* Timeline Page */}
            <div
              style={{
                background: 'var(--ink-raised)',
                border: '1px solid rgba(232, 224, 210, 0.1)',
                padding: 'var(--sp-5)',
                borderRadius: 4,
              }}
            >
              <h3
                className="font-display"
                style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fossil)', marginBottom: 8 }}
              >
                2. Strata Timeline (<code style={{ color: 'var(--lichen)' }}>/projects/:projectId</code>)
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.6, marginBottom: 12 }}>
                Visualizes runs as stacked sediment bands, ordered with the newest run on top.
              </p>
              <ul style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                <li><strong>Band Height:</strong> Proportional to duration (quick unit tests render as compact strata; long integration runs expand).</li>
                <li><strong>Fracture Edge:</strong> Failed runs render with a jagged top fracture border representing broken layers.</li>
                <li><strong>Rail Color Coding:</strong>
                  <ul style={{ marginTop: 4 }}>
                    <li><strong style={{ color: 'var(--sandstone)' }}>Sandstone Left Rail:</strong> Human developer run (shows user handle).</li>
                    <li><strong style={{ color: 'var(--glacier)' }}>Glacier Cyan Rail:</strong> Autonomous AI agent run (shows agent name, e.g. <code style={{ color: 'var(--glacier)' }}>AutoDev-v2</code>).</li>
                  </ul>
                </li>
                <li><strong>Live Socket Synchronization:</strong> When a new run arrives over Socket.IO, it animates smoothly into the top layer with an accent glow.</li>
                <li><strong>Filtering:</strong> Instant toggle between All / Human / Agent runs, or filter by Success / Failed / Running states.</li>
              </ul>
            </div>

            {/* Run Detail Page */}
            <div
              style={{
                background: 'var(--ink-raised)',
                border: '1px solid rgba(232, 224, 210, 0.1)',
                padding: 'var(--sp-5)',
                borderRadius: 4,
              }}
            >
              <h3
                className="font-display"
                style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fossil)', marginBottom: 8 }}
              >
                3. Run Detail (<code style={{ color: 'var(--lichen)' }}>/runs/:runId</code>)
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.6, marginBottom: 12 }}>
                The core analytical layer answering: <em>"Why did this run fail, and is it safe to ship?"</em>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--sp-4)' }}>
                {/* Stamp */}
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: 'var(--sp-3)', borderRadius: 3 }}>
                  <div style={{ color: 'var(--saffron)', fontWeight: 700, fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                    THE VERDICT STAMP
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--fossil-dim)', margin: 0, lineHeight: 1.5 }}>
                    Large rotated stamp giving an instantaneous safety verdict:
                    <br /><strong style={{ color: 'var(--lichen)' }}>SAFE:</strong> Safe to merge/ship.
                    <br /><strong style={{ color: 'var(--saffron)' }}>RISKY:</strong> Unstable / flaky behavior.
                    <br /><strong style={{ color: 'var(--fault)' }}>BLOCKED:</strong> Severe regression / breaking error.
                  </p>
                </div>

                {/* Fork Track */}
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: 'var(--sp-3)', borderRadius: 3 }}>
                  <div style={{ color: 'var(--fault)', fontWeight: 700, fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                    FORKED DIVERGENCE TRACK
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--fossil-dim)', margin: 0, lineHeight: 1.5 }}>
                    For failed runs, compares step-by-step against the last passing baseline run. The track draws a shared line that forks at the <strong>first mismatching step</strong>, annotating the exact divergence reason.
                  </p>
                </div>

                {/* Depth Scale */}
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: 'var(--sp-3)', borderRadius: 3 }}>
                  <div style={{ color: 'var(--glacier)', fontWeight: 700, fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                    SIMILAR FAILURES (DEPTH SCALE)
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--fossil-dim)', margin: 0, lineHeight: 1.5 }}>
                    Vertical geological ruler placing past failure stack traces by vector similarity percentage (e.g., 91%, 84%). Click any depth marker to inspect past resolutions.
                  </p>
                </div>

                {/* Flaky vs Regression */}
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: 'var(--sp-3)', borderRadius: 3 }}>
                  <div style={{ color: 'var(--sandstone)', fontWeight: 700, fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                    FLAKY VS REGRESSION
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--fossil-dim)', margin: 0, lineHeight: 1.5 }}>
                    Statistical failure rate analyzer. Distinguishes newly broken code (regression) from intermittently failing tests (flaky) with failure rate telemetry.
                  </p>
                </div>
              </div>
            </div>

            {/* Demo Drawer */}
            <div
              style={{
                background: 'var(--ink-raised)',
                border: '1px solid rgba(232, 224, 210, 0.1)',
                padding: 'var(--sp-5)',
                borderRadius: 4,
              }}
            >
              <h3
                className="font-display"
                style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fossil)', marginBottom: 8 }}
              >
                4. Stage Demo Controls Drawer (Bottom-Right)
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.6, marginBottom: 8 }}>
                Built specifically for live hackathon demos and stage presentations. Lets presenters trigger realistic scenarios without touching a terminal:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ background: 'rgba(232, 224, 210, 0.08)', padding: '3px 8px', borderRadius: 3, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  ▶ Agent Diverging Run
                </span>
                <span style={{ background: 'rgba(232, 224, 210, 0.08)', padding: '3px 8px', borderRadius: 3, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  ▶ Human Run (Safe)
                </span>
                <span style={{ background: 'rgba(240, 69, 127, 0.15)', color: 'var(--fault)', padding: '3px 8px', borderRadius: 3, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  ⚡ Send Duplicate (409 Dedup)
                </span>
                <span style={{ background: 'rgba(240, 69, 127, 0.15)', color: 'var(--fault)', padding: '3px 8px', borderRadius: 3, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  ⚡ Malformed Event (400 Schema)
                </span>
                <span style={{ background: 'rgba(227, 169, 43, 0.15)', color: 'var(--saffron)', padding: '3px 8px', borderRadius: 3, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  ⚡ Flaky Test Run
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── SECTION 3: AI AGENT & MCP INTEGRATION ──────────────────────────── */}
      {(activeSection === 'all' || activeSection === 'mcp') && (
        <section
          id="agent-mcp"
          style={{
            marginBottom: 'var(--sp-12)',
            padding: 'var(--sp-6)',
            background: 'rgba(127, 209, 193, 0.03)',
            border: '1px solid rgba(127, 209, 193, 0.3)',
            borderRadius: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--sp-3)' }}>
            <span
              style={{
                background: 'var(--glacier)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 2,
              }}
            >
              MCP PROTOCOL
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
              Model Context Protocol for AI Coding Assistants
            </span>
          </div>

          <h2
            className="font-display"
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 800,
              color: 'var(--fossil)',
              marginBottom: 'var(--sp-3)',
            }}
          >
            AI Agent & Model Context Protocol (MCP) Integration
          </h2>

          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--fossil)',
              lineHeight: 1.7,
              marginBottom: 'var(--sp-4)',
            }}
          >
            CONTINUUM exposes an official <strong>MCP server</strong> via Server-Sent Events (SSE). When you configure your agent (Cursor, Claude Code, GitHub Copilot) with CONTINUUM’s MCP server, the agent gains memory across sessions.
          </p>

          <h3
            className="font-display"
            style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fossil)', marginBottom: 8 }}
          >
            Agent Tools Available in CONTINUUM MCP:
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
            <div style={{ background: 'var(--ink-raised)', padding: 'var(--sp-4)', borderRadius: 4 }}>
              <code style={{ color: 'var(--glacier)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                findSimilarFailures
              </code>
              <p style={{ fontSize: '11px', color: 'var(--fossil-dim)', marginTop: 6, margin: 0, lineHeight: 1.5 }}>
                Searches historical stack traces and error messages using cosine similarity to discover how previous engineers or agents resolved the same bug.
              </p>
            </div>
            <div style={{ background: 'var(--ink-raised)', padding: 'var(--sp-4)', borderRadius: 4 }}>
              <code style={{ color: 'var(--glacier)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                getProjectHistory
              </code>
              <p style={{ fontSize: '11px', color: 'var(--fossil-dim)', marginTop: 6, margin: 0, lineHeight: 1.5 }}>
                Provides the agent with the project’s recent run trajectory, passing baselines, and flaky test statistics before it attempts a code change.
              </p>
            </div>
            <div style={{ background: 'var(--ink-raised)', padding: 'var(--sp-4)', borderRadius: 4 }}>
              <code style={{ color: 'var(--glacier)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                submitRunEvent
              </code>
              <p style={{ fontSize: '11px', color: 'var(--fossil-dim)', marginTop: 6, margin: 0, lineHeight: 1.5 }}>
                Allows the agent to emit structured events (<code style={{ color: 'var(--fossil)' }}>plan_step</code>, <code style={{ color: 'var(--fossil)' }}>tool_call</code>, <code style={{ color: 'var(--fossil)' }}>diff_submitted</code>) into the live timeline while it works.
              </p>
            </div>
          </div>

          <h3
            className="font-display"
            style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fossil)', marginBottom: 8 }}
          >
            Configuring Cursor or Claude Code:
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', marginBottom: 8 }}>
            Add the following snippet to your <code style={{ color: 'var(--fossil)' }}>.cursor/mcp.json</code> or Claude Desktop configuration:
          </p>
          <CodeSnippet
            caption=".cursor/mcp.json — User Scoped Configuration"
            language="json"
            code={`{
  "mcpServers": {
    "continuum": {
      "url": "https://continuum-api-rkp4.onrender.com/sse?token=YOUR_JWT_AUTH_TOKEN"
    }
  }
}`}
          />
        </section>
      )}

      {/* ─── SECTION 4: ARCHITECTURE & GUARANTEES ──────────────────────────── */}
      {(activeSection === 'all' || activeSection === 'arch') && (
        <section
          id="architecture"
          style={{
            marginBottom: 'var(--sp-12)',
            padding: 'var(--sp-6)',
            background: 'rgba(201, 162, 126, 0.03)',
            border: '1px solid rgba(201, 162, 126, 0.3)',
            borderRadius: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--sp-3)' }}>
            <span
              style={{
                background: 'var(--sandstone)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 2,
              }}
            >
              ARCHITECTURE
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)' }}>
              Data Ingestion & Integrity Guarantees
            </span>
          </div>

          <h2
            className="font-display"
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 800,
              color: 'var(--fossil)',
              marginBottom: 'var(--sp-3)',
            }}
          >
            System Architecture & Data Guarantees
          </h2>

          <div
            style={{
              background: 'var(--ink-raised)',
              border: '1px solid rgba(232, 224, 210, 0.1)',
              padding: 'var(--sp-5)',
              borderRadius: 4,
              marginBottom: 'var(--sp-6)',
            }}
          >
            <h3
              className="font-display"
              style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--fossil)', marginBottom: 8 }}
            >
              1. Deduplication & Idempotency Guarantee
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.6, margin: 0 }}>
              CONTINUUM enforces a strict unique index on <code style={{ color: 'var(--fossil)' }}>_id</code> in the MongoDB events collection. If network retries or distributed agent workers emit the same event twice, the database instantly rejects the duplicate with an <code style={{ color: 'var(--fault)' }}>HTTP 409 Conflict</code>. The dashboard intercepts this and displays a clear toast with the rejected duplicate ID.
            </p>
          </div>

          <div
            style={{
              background: 'var(--ink-raised)',
              border: '1px solid rgba(232, 224, 210, 0.1)',
              padding: 'var(--sp-5)',
              borderRadius: 4,
              marginBottom: 'var(--sp-6)',
            }}
          >
            <h3
              className="font-display"
              style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--fossil)', marginBottom: 8 }}
            >
              2. Strict MongoDB Schema Validation ($jsonSchema)
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.6, margin: 0 }}>
              Events entering the pipeline are verified against native MongoDB <code style={{ color: 'var(--fossil)' }}>$jsonSchema</code> rules. Missing critical fields (such as <code style={{ color: 'var(--fossil)' }}>run_id</code> or an invalid event type) are halted at the database boundary before reaching intelligence analysis.
            </p>
          </div>

          <div
            style={{
              background: 'var(--ink-raised)',
              border: '1px solid rgba(232, 224, 210, 0.1)',
              padding: 'var(--sp-5)',
              borderRadius: 4,
            }}
          >
            <h3
              className="font-display"
              style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--fossil)', marginBottom: 8 }}
            >
              3. Dual-Mode Operation (Mock vs Real API)
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fossil-dim)', lineHeight: 1.6, marginBottom: 8 }}>
              CONTINUUM is designed for zero demo friction. You can switch the entire frontend from standalone mock mode to production cloud backend with a single environment variable:
            </p>
            <CodeSnippet
              caption="dashboard/.env"
              language="bash"
              code={`# Standalone mode: Instant local evaluation without backend
VITE_USE_MOCKS=true

# Live Production Mode: Connects to Express API and MongoDB
VITE_USE_MOCKS=false
VITE_API_URL=https://continuum-api-rkp4.onrender.com
VITE_SOCKET_URL=https://continuum-api-rkp4.onrender.com`}
            />
          </div>
        </section>
      )}

      {/* Footer navigation */}
      <div
        style={{
          borderTop: '1px solid rgba(232, 224, 210, 0.1)',
          paddingTop: 'var(--sp-6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--sp-4)',
        }}
      >
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--fossil-dim)',
            textDecoration: 'none',
          }}
        >
          &larr; Back to Home
        </Link>
        <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
          <Link
            to="/projects"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--saffron)',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Open Projects &rarr;
          </Link>
          <Link
            to="/projects/proj_alpha"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--lichen)',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Explore Live Timeline &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
