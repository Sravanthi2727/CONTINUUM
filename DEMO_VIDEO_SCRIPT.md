# CONTINUUM: 7-Minute Video Demo Script
**Track 3: Developer Tools for Production Use Cases | UNCHARTED 2026 Hackathon**  
*Target Duration: ~6:45 to 7:00 Minutes (Strictly within the 7-minute limit)*

---

### ⏱️ Time Budget & Scene Breakdown

| Section | Timestamp | Duration | Focus Area |
| :--- | :--- | :--- | :--- |
| **1. Hook & Problem Statement** | 0:00 – 1:00 | 60s | The agent amnesia / lost context problem |
| **2. Solution Overview & Architecture** | 1:00 – 2:00 | 60s | What CONTINUUM is + The MongoDB Advantage |
| **3. Live Demo: Execution & Realtime Feed** | 2:00 – 3:30 | 90s | CLI (`cnt run`) + Agent Run + Live Dashboard |
| **4. Deep Dive: Intelligence & Divergence** | 3:30 – 4:45 | 75s | Divergence detection + Atlas Vector Search on failures |
| **5. Robustness & Failure Cases** | 4:45 – 5:45 | 60s | Duplicate dedup (E11000) & Schema validation ($jsonSchema) |
| **6. Cross-Session Agent Memory (MCP/CLI)** | 5:45 – 6:30 | 45s | New session inheriting history & verdict |
| **7. Conclusion & Judging Summary** | 6:30 – 7:00 | 30s | Impact, links, and wrap-up |

---

## 📽️ Full Dialogue & Action Script

### SECTION 1: The Hook & The Problem (0:00 – 1:00)
**[Visual on screen]:** Title slide with logo: *"CONTINUUM: Memory that outlives the session."* Followed by a split-screen visual or terminal recording showing an AI agent and a human developer hitting identical build/test errors repeatedly across different sessions.

> **Speaker (Spoken clearly, engaging):**  
> *"Every software team today is adopting AI coding agents. But here is the silent productivity killer: every time an agent session closes or a developer switches tasks, all that execution context vanishes.*  
>  
> *When an agent breaks a build, tests flake, or code diverges from past working states, nobody knows why without digging through thousands of lines of terminal logs. Worse, the next agent you spin up has complete amnesia—repeating the exact same mistakes.*  
>  
> *Welcome to **CONTINUUM**—a unified CLI and MCP layer that captures every build, test, and deploy run—human or agent—into MongoDB, turns that execution history into real-time diagnoses, and gives every teammate and future agent session continuous, persistent memory."*

---

### SECTION 2: Architecture & Why MongoDB (1:00 – 2:00)
**[Visual on screen]:** Clean slide showing the Architecture Diagram:
`CLI / Agent MCP` ➔ `Ingestion API (Express + TS)` ➔ `MongoDB Atlas (Vector Search + Change Streams)` ➔ `Socket.IO` ➔ `Live React Dashboard`.

> **Speaker:**  
> *"Before jumping into the live demo, let’s look at why this was built on MongoDB Atlas.*  
>  
> *Normally, building CONTINUUM would require four to five fragmented services: Redis for duplicate caching, Kafka for streaming, an external vector database for failure similarity matching, and strict backend validation middleware.*  
>  
> *MongoDB replaces all of that with a single, elegant platform:*  
> 1. *Primary key `_id` idempotency eliminates duplicate event floods instantly.*  
> 2. *`$jsonSchema` validates structured metadata while allowing fully flexible execution payloads.*  
> 3. *Change Streams broadcast events instantly to our dashboard with zero polling.*  
> 4. *Atlas Vector Search indexes error embeddings right alongside the data.*  
>  
> *One database powers the entire ingestion, intelligence, and streaming pipeline."*

---

### SECTION 3: Live Demo — Unified Execution & Realtime Feed (2:00 – 3:30)
**[Visual on screen]:** Screen recording of the **deployed React Dashboard** at the Timeline view. Side-by-side with a terminal window.

> **Speaker:**  
> *"Here is our live deployed CONTINUUM dashboard. Let’s simulate a real developer workflow.*  
>  
> *First, as a human developer, I run a test suite using our CLI tool:*  
> `cnt run "npm test"`  
>  
> *(Trigger command in terminal)*  
> *Notice that instantly, without refreshing, the dashboard updates via MongoDB Change Streams and WebSockets. You see the run ID, the human trigger, the timestamp, and the green passing status.*  
>  
> *Now, let’s simulate an autonomous coding agent taking on a task. The agent generates code changes and runs tests through our ingestion API.*  
>  
> *(Trigger agent run)*  
> *Immediately, the dashboard flags this run as **Source: Agent**, tags the agent name, and tracks every step in real-time. Whether it's a human engineer in Git Bash or an autonomous agent in CI/CD, all execution converges into a single source of truth."*

---

### SECTION 4: Deep Dive — Divergence & Vector Failure Matching (3:30 – 4:45)
**[Visual on screen]:** Click into a failed Agent Run on the dashboard. Open the **Run Detail** page, showing the **Verdict Badge (BLOCKED / RISKY)**, **Divergence Panel**, and **Similar Past Failures**.

> **Speaker:**  
> *"Now, what happens when things go wrong?*  
>  
> *Here is an agent run that just failed. The dashboard immediately updates the verdict badge to **BLOCKED**.*  
>  
> *Instead of forcing the engineer to read 500 lines of raw stack traces, CONTINUUM's aggregation pipeline compares this failed run against the last known successful run on this branch.*  
>  
> *Look at the **Divergence Panel**: it isolates the exact step where behavior deviated—Step 4: the database connection string mock was altered.*  
>  
> *Next, look below at **Similar Past Failures**. Using **MongoDB Atlas Vector Search**, the error embedding was semantically matched against historical failures across the entire repository. It surfaces with 94% similarity: 'Similar timeout occurred yesterday in Run #42—resolved by increasing pool size.'*  
>  
> *The developer or agent gets the root cause and the proven fix in seconds."*

---

### SECTION 5: Robustness & Failure Cases (Compulsory Requirement) (4:45 – 5:45)
**[Visual on screen]:** Split screen between terminal / Postman / Compass and the application logs.

> **Speaker:**  
> *"A developer tool for production must be bulletproof against bad data and network re-tries. We explicitly tested CONTINUUM against real failure modes using native MongoDB capabilities.*  
>  
> *Case 1: **Duplicate Event Flood**. If an agent retries an event with an existing `event_id`, MongoDB’s unique `_id` constraint immediately trips an E11000 duplicate key error. Our ingestion layer intercepts it and returns a clean `409 Duplicate Rejected`.*  
> *(Show terminal / Postman executing duplicate request and getting 409).*  
>  
> *Case 2: **Malformed Event Ingestion**. If a misconfigured agent submits a payload missing compulsory fields like `run_id` or `timestamp`, MongoDB’s `$jsonSchema` engine rejects it at the database level before it can corrupt downstream metrics.*  
> *(Show malformed JSON getting rejected with 400 Bad Request).*  
>  
> *MongoDB protects our data integrity natively without custom cache-validation boilerplate."*

---

### SECTION 6: Cross-Session Agent Memory (5:45 – 6:30)
**[Visual on screen]:** Launch a fresh terminal or prompt simulating a brand new agent session.

> **Speaker:**  
> *"Finally, here is the real superpower: **Session Continuity**.*  
>  
> *I am opening a completely brand-new agent session with a clean context window. In a standard setup, this agent would have zero awareness of the past 24 hours of debugging.*  
>  
> *With CONTINUUM, the agent connects via our MCP / CLI interface and queries `cnt history` or `getProjectHistory`.*  
>  
> *Instantly, the agent reads the project’s stability score, recent failed steps, and the safe verdict status. It knows exactly what failed previously and avoids repeating the regression.*  
>  
> *The team’s memory is preserved across sessions, machines, and tools."*

---

### SECTION 7: Summary & Impact (6:30 – 7:00)
**[Visual on screen]:** Final slide with Live App URL, GitHub Repo QR code, and Team Credits.

> **Speaker:**  
> *"To wrap up: CONTINUUM transforms ephemeral execution logs into an intelligent, persistent organizational memory.*  
>  
> *By combining MongoDB Atlas Vector Search, Change Streams, and flexible document modeling, we’ve built an end-to-end, production-ready developer tool that answers the most critical question in modern CI/CD:*  
> **'Why did this run fail, and is it safe to ship?'**  
>  
> *The application is fully deployed and accessible at our live URL in the description, with full source code available on GitHub.*  
>  
> *Thank you from the CONTINUUM team!"*

---

### 💡 Tips for Recording:
1. **Pre-warm your deployed services:** If using Render's free tier, open the API URL 5 minutes beforehand so it doesn't have cold-start delay during the demo.
2. **Audio Quality:** Use a decent mic with low background noise; speak at a deliberate, confident pace (~130 words per minute matches this ~900-word script to 7 minutes).
3. **Cursor Visibility:** Enable mouse click highlights or zoom in slightly on code and terminal commands for high readability at 1080p.
