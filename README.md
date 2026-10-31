# CONTINUUM

> *"Memory that outlives the session."*

**A CLI + MCP layer that captures every build/test/deploy run — human or agent — into MongoDB, turns that history into live diagnoses (why it failed, is it safe), and gives any agent, any session, any teammate access to the same memory.**

---

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Human CLI   │─────▶│              │      │                 │
│ "cnt run ..."│      │  Ingestion    │─────▶│    MongoDB      │
└─────────────┘      │  API (Express │      │  Atlas          │
┌─────────────┐      │  + TS)        │      │  - projects     │
│ Agent (MCP   │─────▶│              │      │  - runs         │
│ tool calls)  │      └──────┬───────┘      │  - events       │
└─────────────┘             │               │  - verifications│
                             │               │  - findings     │
                      ┌──────▼───────┐      └────────┬────────┘
                      │ Change Stream │               │
                      │ Listener      │◀──────────────┘
                      └──────┬───────┘
                             │ (websocket)
                      ┌──────▼───────┐
                      │ Web Dashboard │
                      │ (React + TS)  │
                      └───────────────┘
```

Two independent write paths (CLI, MCP) → one ingestion API → one MongoDB → live-pushed to one dashboard.

## Tech Stack (all TypeScript)

| Layer | Tech |
|---|---|
| CLI | Node + TypeScript, `commander` |
| Ingestion API | Express/Fastify + TypeScript |
| MCP Server | `@modelcontextprotocol/sdk` (`getProjectHistory`, `findSimilarFailures`) |
| Database | MongoDB Atlas (Vector Search + Change Streams + Atlas Triggers) |
| Embeddings | Voyage AI / OpenAI `text-embedding-3-small` via Atlas Trigger |
| Realtime | MongoDB Change Streams → Socket.IO |
| Web Dashboard | React + Vite + TypeScript |
| Auth | JWT email/password or magic-link, scoped by `owner_id` |
| Hosting | Render/Railway (API), Vercel (dashboard) |

## Data Model

- **Project** — `project_id`, `owner_id`, `name`, `repo_url`, `instrumentation_enabled`, `created_at`
- **Run** — `run_id`, `project_id`, `source` (human/agent), `agent_name`, `triggered_by`, `commit_sha`, `task_description`, `status`, `started_at`, `ended_at`
- **Event** — `event_id` (unique), `run_id`, `type`, `step`, `payload`, `error_message`, `error_embedding`, `timestamp`
- **Verification** — `run_id`, `claims[]`, `verdict` (safe/risky/blocked), `computed_at`
- **Finding** — `project_id`, `type` (flaky_test/regression/divergence/similar_past_failure), `details`, `created_at`

## Core Pipelines

1. **Flaky vs Regression** — failure rate of a test over last N runs → verdict.
2. **Run Divergence (Debugger)** — `$lookup` failed run's events against last successful run, align by `step`, find first mismatch.
3. **Claim Verification** — cross-check agent's claimed requirements/tests against actual diff + test results → proven/unproven/blocked.
4. **Semantic Failure Clustering** — vector search on `error_embedding` → "N% similar to past failures."
5. **Live Timeline** — change stream on `events` → push to dashboard via Socket.IO.

## CLI

```bash
cnt init          # registers project, writes .continuum.json
cnt run "npm test"  # wraps command, logs command_run event
cnt link-agent    # prints MCP server config snippet
cnt history       # last N runs for this project
```

## MCP Tools

- `getProjectHistory(project_id): Run[]`
- `findSimilarFailures(error_text): Finding[]`
- `submitRunEvent(run_id, event): void`

## Dashboard (4 pages)

1. Login — JWT, scopes by `owner_id`
2. Projects list
3. Timeline view — live-updating run history, filter human vs agent
4. Run detail — events sequence, verdict badge, divergence panel, similar-failures panel

## Why MongoDB

Everything here would normally require 3–4 separate pieces of infrastructure stitched together. MongoDB does it as one system — unique index for dedup, `$jsonSchema` for validation, aggregation for flakiness, Change Streams for realtime, Atlas Vector Search for semantic matching.

## Detailed Spec

See [`code.txt`](./code.txt) for the full team breakdown, demo script, and hour-by-hour plan.
