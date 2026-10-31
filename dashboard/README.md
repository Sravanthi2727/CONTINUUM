# CONTINUUM Dashboard

> *"Memory that outlives the session."*

The visual layer for CONTINUUM — a developer tool for UNCHARTED 2026 (Track 3) that captures build/test/deploy runs into MongoDB and turns execution history into live diagnoses: why a run failed, whether a change is safe to ship, and where agent workflows diverged.

---

## Setup

```bash
cd dashboard
npm install
cp .env.example .env
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the ingestion backend API (no trailing slash) |
| `VITE_SOCKET_URL` | Socket.IO server URL for live updates |
| `VITE_USE_MOCKS` | Flag (`true` or `false`) to toggle between local mock data and real API |

---

## How to Run in Mock Mode

Mock mode runs completely locally with no backend required. It includes simulated socket events, live run progression, and canned failure diagnostics.

```bash
# In .env: VITE_USE_MOCKS=true
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## How to Point at the Real API

1. In `.env`, set:
   - `VITE_USE_MOCKS=false`
   - `VITE_API_URL` to the deployed backend URL
   - `VITE_SOCKET_URL` to the deployed Socket.IO server URL
2. Restart the dev server (`npm run dev`).
3. If the backend socket is disconnected, the top bar displays "Reconnecting" and reconnects automatically without crashing.
4. If an API request fails, an error panel displays the HTTP status with a Retry button.

---

## Deploying to Vercel

1. Import the repository in Vercel.
2. In **Project Settings**:
   - Set **Root Directory** to `dashboard`
   - Framework preset: `Vite` (configured via `vercel.json`)
   - Output directory: `dist`
3. Add the three environment variables (`VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_USE_MOCKS`) in the Vercel dashboard.
4. Deploy. The included `vercel.json` rewrite routes all deep links (such as `/projects/:id` and `/runs/:id`) to `/index.html`.
5. Share the generated Vercel production domain with Member A to add to the backend CORS allow-list.

---

## Demo Controls

The collapsible drawer in the bottom-right corner provides one-click triggers for live stage demos:

- **Start agent run:** Emits a live agent run (`glacier` badge) that updates the timeline in real time.
- **Start human run:** Emits a live CLI human run (`sandstone` badge).
- **Start diverging agent run:** Starts an agent run that executes steps 1–3, introduces a breaking change at step 3, hits an error at step 4, fractures live to `failed`, and updates the verdict to `blocked`.
- **Send duplicate event:** Sends an event with an already used `_id`, verifying that MongoDB enforces idempotency and returns HTTP 409.
- **Send malformed event:** Sends a payload missing `run_id`, verifying schema validation and returning HTTP 400.

---

## Scripts

- `npm run dev`: Start Vite development server
- `npm run build`: Production static build to `dist/`
- `npm run typecheck`: Run TypeScript compiler check (`tsc --noEmit`)
- `npm run preview`: Preview production build locally
