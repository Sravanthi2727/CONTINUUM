# CONTINUUM

> *"Memory that outlives the session."*

**A CLI + MCP layer that captures every build/test/deploy run — human or agent — into MongoDB, turns that history into live diagnoses (why it failed, is it safe), and gives any agent, any session, any teammate access to the same memory.**

**Track:** Track 3, Developer Tools for Production Use Cases  
**Live Deployed URLs:**
- 🌐 **Web Dashboard:** [https://continuum-jrxa.onrender.com](https://continuum-jrxa.onrender.com)
- 🔌 **Ingestion API:** [https://continuum-api-rkp4.onrender.com](https://continuum-api-rkp4.onrender.com)
- 📡 **API Health Check:** [https://continuum-api-rkp4.onrender.com/health](https://continuum-api-rkp4.onrender.com/health)

---

## 1. Architecture

```
  Human CLI ──┐
              ├──▶ Ingestion API (Express + TS) ──▶ MongoDB Atlas
  Agent / MCP ─┘            │                           │
                            │                  Change Streams
                            │                           │
                            └─────── Socket.IO ◀────────┘
                                          │
                                   React Dashboard
```

Two independent write paths (Human CLI, Agent MCP) feed **one** ingestion API and **one** database, which pushes live state via Change Streams to **one** dashboard.

---

## 2. Why MongoDB? (Single System Advantage)

| Problem | Traditional Architecture | With MongoDB |
|---|---|---|
| **Event Deduplication** | Redis cache + distributed lock + manual check | Unique `_id` (`event_id`) on the `events` collection (`E11000` handled cleanly) |
| **Schema Validation** | Custom middleware per endpoint | `$jsonSchema` database-level collection validator |
| **Run Divergence & Flakiness** | Pull all logs to app memory, iterate & group | Aggregation pipelines computed inside the database engine |
| **Realtime Dashboard** | External Pub/Sub (Kafka/RabbitMQ) + polling | Built-in **MongoDB Change Streams** (`db.events.watch()`) piped to Socket.IO |
| **Semantic Failure Clustering** | External Vector DB (Pinecone/Weaviate) + sync jobs | **Atlas Vector Search** residing in the same collection alongside structured data |

> *"Everything here would normally require 3–4 separate infrastructure pieces. MongoDB delivers it as one cohesive system."*

---

## 3. Monorepo Structure

```
CONTINUUM/
├── packages/
│   ├── api/             # Express + TypeScript + Socket.IO server & Change Streams
│   ├── intelligence/    # Member B Core: Flaky vs Regression, Divergence Debugger, Claim Verification, Vector Search
│   ├── mcp-server/      # Model Context Protocol server (getProjectHistory, findSimilarFailures, submitRunEvent)
│   ├── cli/             # Developer CLI: cnt init, cnt run, cnt history, cnt link-agent
│   ├── dashboard/       # React + Vite + TypeScript dashboard (Projects, Timeline, Run Detail with Live Demo)
│   └── seed/            # Comprehensive seed script with 2 weeks of realistic human & agent runs
```

---

## 4. Member B: Intelligence Layer Pipelines

1. **Run Divergence Debugger (`/intelligence/divergence?run_id=...`)**
   - Compares a failed run's step events against the last successful run on the same project.
   - Automatically aligns events by `step` and isolates the exact divergence point, mismatching event types, and payload diffs.

2. **Flaky vs Regression (`/intelligence/flaky?test_name=...&project_id=...`)**
   - Aggregates `test_result` events across commits.
   - If failures occur intermittently across multiple distinct commits → flagged as **Flaky Test**.
   - If failures correlate with a specific commit introduction → flagged as **Regression**.

3. **Claim Verification (`/intelligence/verify`)**
   - Audits agent claims (e.g. "auth fixed", "all tests pass") against actual `diff_submitted` and `test_result` events.
   - Generates deterministic verdicts: `safe`, `risky`, or `blocked`.

4. **Vector Search / Semantic Failure Clustering (`/intelligence/similar?error_text=...`)**
   - Queries Atlas Vector Search on `error_embedding` or token overlap similarity.
   - Instantaneously surfaces past runs with identical or related root causes.

---

## 5. Quick Start & Setup

### Prerequisites
- Node.js 18+ (tested on Node v22)
- MongoDB Atlas cluster URI

### Environment Setup

Create `.env` in `packages/api`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@continuum.xn4mwbj.mongodb.net/continuum?retryWrites=true&w=majority
PORT=3001
JWT_SECRET=continuum_secret_2026
CLIENT_URL=http://localhost:5173
```

Create `.env` in `packages/mcp-server`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@continuum.xn4mwbj.mongodb.net/continuum?retryWrites=true&w=majority
API_BASE_URL=http://localhost:3001
```

Create `.env` in `packages/dashboard`:
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### Installation & Build

```bash
# Install root and workspace dependencies
npm install

# Build all packages (API, CLI, Intelligence, MCP, Dashboard)
npm run build

# Seed the database with realistic demo runs and events
npm run seed
```

### Running the Services

```bash
# Terminal 1: Run Ingestion API & Change Stream listener
npm run dev:api

# Terminal 2: Run Dashboard
npm run dev:dashboard
```

---

## 6. CLI Usage (`cnt`)

The unified CLI works across macOS, Linux, and Windows via npm/npx:

```bash
# 1. User Authentication
cnt login                  # Authenticate and securely store token in ~/.continuum/auth.json
cnt register               # Create new CONTINUUM user account
cnt whoami                 # Check current active cloud session
cnt logout                 # Clear credentials

# 2. Project Lifecycle
cnt init                   # Interactively init or pass flags (-n <name> -r <repo>)
cnt projects               # List projects available to your user account
cnt clean                  # Remove local .continuum.json (or --cloud to wipe DB project)

# 3. Execution (Human or Agent)
cnt run "npm test"         # Wrap command, streams command_run, test_result, error to MongoDB
cnt run "npm test" --source agent --agent "Claude" # Log agent runs directly

# 4. Lifecycle Event Ingestion
cnt log -t plan_step -m "Analyzing architecture"
cnt log -t tool_call -p '{"tool":"git_diff","args":"HEAD~1"}'
cnt log -t diff_submitted -p '{"files":["auth.ts"]}'
cnt log -t error -m "SyntaxError: Unexpected token"

# 5. Combined Agent Run Debugger & Change Verifier
cnt divergence -r <run_id> # Isolate exact step-by-step misalignment against baseline run
cnt verify -r <run_id>     # Audit agent claims against events (safe | risky | blocked)

# 6. History & MCP Linking
cnt history -n 10          # Terminal overview of recent runs
cnt link-agent             # Output Streamable HTTP MCP snippet for Claude/Cursor
```

---

## 7. Model Context Protocol (MCP) Server

Connect your AI agent (Claude Desktop, Cursor, Copilot, AGY) using **Streamable HTTP** (the latest official MCP spec):

### Modern Streamable HTTP (Recommended for Claude Desktop & Cursor):
Under Claude / Cursor MCP Settings:
- **Transport:** `Streamable HTTP` (or `HTTP`)
- **URL:**
```
https://continuum-api-rkp4.onrender.com/mcp
```

Or in JSON config:
```json
{
  "mcpServers": {
    "continuum": {
      "url": "https://continuum-api-rkp4.onrender.com/mcp"
    }
  }
}
```

*(Legacy SSE transport remains available at `https://continuum-api-rkp4.onrender.com/sse` for older clients).*

Exposed MCP Tools:
- `getProjectHistory(project_id, limit)`: Provides cross-session historical context to AI agents.
- `findSimilarFailures(error_text, limit)`: Diagnoses current agent errors using past failure clusters.
- `submitRunEvent(run_id, event_id, type, step, payload, error_message)`: Allows agents to register their actions directly into CONTINUUM.

---

## 8. Live Demo Script (Judges Walkthrough)

1. **Dashboard Overview (`http://localhost:5173`)**:
   - Open projects list → select `CONTINUUM Demo Project`.
   - View timeline with human vs agent runs, status badges, and duration.
2. **Divergence Debugger**:
   - Click on the failed run (`d2bd20cd-7026-4d4b-98e9-46dbed57649c`).
   - Examine the **Divergence Analysis panel**: shows exact step mismatch between the failed run and the prior successful run.
   - Review **Similar Past Failures** matching the error text.
3. **Live Failure Case Testing**:
   - Click **"Replay Duplicate event_id"** button in the dashboard: MongoDB rejects it with `409 DUPLICATE_EVENT` (E11000).
   - Click **"Send Malformed Event"** button: MongoDB / API rejects it with `400 / 422 SCHEMA_VIOLATION`.
4. **Live CLI Execution**:
   - Run `node packages/cli/dist/index.js run "npm test"`.
   - Watch the new run and events stream live into the dashboard via Socket.IO change streams without page refreshes!
