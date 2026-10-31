import "dotenv/config";
import { MongoClient } from "mongodb";
import { v4 as uuidv4 } from "uuid";
// Inline embedding generator (no cross-package dep needed)
function textToFakeEmbedding(text: string): number[] {
  const dim = 128;
  const vec: number[] = [];
  for (let i = 0; i < dim; i++) {
    let h = 0;
    for (let j = 0; j < text.length; j++) {
      h = (h * 31 + text.charCodeAt(j) + i * 17) & 0xffffffff;
    }
    vec.push(((h >>> 0) / 0xffffffff) * 2 - 1);
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return vec.map((v) => (mag === 0 ? 0 : v / mag));
}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://Matin:m4QuMcjneQT6jT3n@continuum.xn4mwbj.mongodb.net/continuum?retryWrites=true&w=majority";

const client = new MongoClient(MONGODB_URI);

const COMMITS = [
  "a1b2c3d",
  "e4f5g6h",
  "i7j8k9l",
  "m1n2o3p",
  "q4r5s6t",
  "u7v8w9x",
  "y1z2a3b",
];

const AGENT_NAMES = ["claude-code", "cursor", "copilot", "aider"];

const ERRORS = [
  "TypeError: Cannot read properties of undefined (reading 'map')",
  "Error: ECONNREFUSED 127.0.0.1:5432 — database connection refused",
  "AssertionError: expected 200 but got 404",
  "ReferenceError: fetch is not defined",
  "SyntaxError: Unexpected token '<' in JSON",
  "Error: Cannot find module './utils/db'",
  "Timeout: Test suite exceeded 5000ms",
  "TypeError: Cannot read properties of null (reading 'split')",
];

const TEST_NAMES = [
  "auth.login.success",
  "auth.login.failure",
  "api.projects.create",
  "api.events.dedup",
  "pipeline.divergence",
  "pipeline.flaky",
  "ui.timeline.render",
  "ui.rundetail.verdict",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function seed() {
  await client.connect();
  const db = client.db("continuum");

  console.log("🌱 Seeding CONTINUUM database...");

  // --- Drop existing seed data ---
  await db.collection("projects").deleteMany({ name: { $in: ["CONTINUUM Demo Project", "Agent Test Repo"] } });

  // --- Create 2 demo projects ---
  const project1Id = uuidv4();
  const project2Id = uuidv4();

  await db.collection("projects").insertMany([
    {
      _id: project1Id,
      owner_id: "demo",
      name: "CONTINUUM Demo Project",
      repo_url: "https://github.com/Sravanthi2727/CONTINUUM",
      created_at: daysAgo(30),
    },
    {
      _id: project2Id,
      owner_id: "demo",
      name: "Agent Test Repo",
      repo_url: "https://github.com/Mohammed-Matin/detox",
      created_at: daysAgo(14),
    },
  ]);
  console.log("✅ Created 2 projects");

  // --- Seed runs for Project 1 (2 weeks of history) ---
  const runs: any[] = [];

  // Successful human runs (days 14-7)
  for (let day = 14; day >= 7; day--) {
    const runId = uuidv4();
    const commit = randomItem(COMMITS);
    const started = daysAgo(day);
    const ended = new Date(started.getTime() + Math.random() * 60000 + 30000);
    runs.push({
      _id: runId,
      project_id: project1Id,
      source: "human",
      triggered_by: "demo",
      commit_sha: commit,
      task_description: "npm test",
      status: "success",
      started_at: started,
      ended_at: ended,
    });
  }

  // Mixed agent + human runs (days 7-2, some failures for the flaky test)
  for (let day = 7; day >= 2; day--) {
    // Human run
    const humanRunId = uuidv4();
    const commit = randomItem(COMMITS);
    const started = daysAgo(day);
    // Introduce some failures on flaky test
    const hasFlakyFailure = Math.random() < 0.4;
    const ended = new Date(started.getTime() + Math.random() * 90000 + 30000);
    runs.push({
      _id: humanRunId,
      project_id: project1Id,
      source: "human",
      triggered_by: "demo",
      commit_sha: commit,
      task_description: "npm test",
      status: hasFlakyFailure ? "failed" : "success",
      started_at: started,
      ended_at: ended,
    });

    // Agent run
    const agentRunId = uuidv4();
    const agentStarted = new Date(started.getTime() + 1800000);
    const agentEnded = new Date(agentStarted.getTime() + Math.random() * 120000 + 60000);
    runs.push({
      _id: agentRunId,
      project_id: project1Id,
      source: "agent",
      agent_name: randomItem(AGENT_NAMES),
      triggered_by: "demo",
      commit_sha: commit,
      task_description: "Fix authentication middleware and update tests",
      status: day <= 3 ? "failed" : "success", // recent agent runs fail (regression scenario)
      started_at: agentStarted,
      ended_at: agentEnded,
    });
  }

  // Most recent failed run (for divergence demo)
  const lastSuccessRunId = runs[runs.length - 2]._id; // last success
  const failedRunId = uuidv4();
  const failedStarted = daysAgo(0);
  const failedEnded = new Date(failedStarted.getTime() + 45000);
  runs.push({
    _id: failedRunId,
    project_id: project1Id,
    source: "agent",
    agent_name: "claude-code",
    triggered_by: "demo",
    commit_sha: "deadbeef",
    task_description: "Refactor database connection pool — reduce latency",
    status: "failed",
    started_at: failedStarted,
    ended_at: failedEnded,
  });

  await db.collection("runs").insertMany(runs);
  console.log(`✅ Created ${runs.length} runs`);

  // --- Seed events for each run ---
  const events: any[] = [];

  for (const run of runs) {
    const isSuccess = run.status === "success";
    const isFailed = run.status === "failed";
    const numSteps = isSuccess ? 5 : Math.floor(Math.random() * 3) + 2;

    // Step 0: command_run
    events.push({
      _id: uuidv4(),
      run_id: run._id,
      type: "command_run",
      step: 0,
      payload: { command: run.task_description || "npm test", pid: Math.floor(Math.random() * 9000 + 1000) },
      timestamp: new Date(run.started_at.getTime() + 100),
    });

    // Steps 1-N: test_result events
    for (let s = 1; s < numSteps; s++) {
      const testName = randomItem(TEST_NAMES);
      const isFlakyTest = testName === "pipeline.flaky";
      // Flaky test fails randomly regardless of run status (for demo)
      const testFails =
        (isFailed && s === numSteps - 1) || (isFlakyTest && Math.random() < 0.4);

      if (testFails) {
        const errMsg = randomItem(ERRORS);
        events.push({
          _id: uuidv4(),
          run_id: run._id,
          type: "test_result",
          step: s,
          payload: { test_name: testName, status: "fail", duration_ms: Math.floor(Math.random() * 2000 + 100) },
          error_message: errMsg,
          error_embedding: textToFakeEmbedding(errMsg),
          timestamp: new Date(run.started_at.getTime() + s * 8000),
        });

        // For final failure step of failed run, add an error event too
        if (isFailed && s === numSteps - 1) {
          events.push({
            _id: uuidv4(),
            run_id: run._id,
            type: "error",
            step: s + 1,
            payload: { exit_code: 1, context: "test runner exited with error" },
            error_message: errMsg,
            error_embedding: textToFakeEmbedding(errMsg),
            timestamp: new Date(run.started_at.getTime() + (s + 1) * 8000),
          });
        }
      } else {
        events.push({
          _id: uuidv4(),
          run_id: run._id,
          type: "test_result",
          step: s,
          payload: { test_name: testName, status: "pass", duration_ms: Math.floor(Math.random() * 1000 + 50) },
          timestamp: new Date(run.started_at.getTime() + s * 8000),
        });
      }
    }

    // For agent runs, add some tool_call and plan_step events
    if (run.source === "agent") {
      events.push({
        _id: uuidv4(),
        run_id: run._id,
        type: "plan_step",
        step: 0,
        payload: {
          plan: ["Analyze failing test", "Identify root cause", "Apply fix", "Run tests", "Submit diff"],
          current: 0,
        },
        timestamp: new Date(run.started_at.getTime() + 50),
      });
      events.push({
        _id: uuidv4(),
        run_id: run._id,
        type: "tool_call",
        step: 1,
        payload: { tool: "read_file", args: { path: "src/db/connection.ts" } },
        timestamp: new Date(run.started_at.getTime() + 2000),
      });
      if (isSuccess) {
        events.push({
          _id: uuidv4(),
          run_id: run._id,
          type: "diff_submitted",
          step: numSteps - 1,
          payload: {
            files: ["src/db/connection.ts", "src/middleware/auth.ts"],
            additions: Math.floor(Math.random() * 50 + 5),
            deletions: Math.floor(Math.random() * 20 + 2),
          },
          timestamp: new Date(run.started_at.getTime() + (numSteps - 1) * 8000),
        });
      }
    }
  }

  // Insert events in batches to avoid schema validator choking
  const BATCH_SIZE = 50;
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    try {
      await db.collection("events").insertMany(batch, { ordered: false });
    } catch (e: any) {
      // Some duplicates from re-seeding are fine
      if (e.code !== 11000) throw e;
    }
  }
  console.log(`✅ Created ${events.length} events`);

  // --- Seed a divergence finding for the failed run ---
  await db.collection("findings").insertOne({
    _id: uuidv4(),
    project_id: project1Id,
    type: "divergence",
    details: {
      run_id: failedRunId,
      compared_run_id: lastSuccessRunId,
      first_mismatch_step: 3,
      failed_event_type: "error",
      success_event_type: "test_result",
      reason:
        'Event type mismatch at step 3: failed run emitted "error" but successful run had "test_result". Error: TypeError: Cannot read properties of undefined (reading \'map\')',
    },
    created_at: new Date(),
  });

  // --- Seed a flaky finding ---
  await db.collection("findings").insertOne({
    _id: uuidv4(),
    project_id: project1Id,
    type: "flaky_test",
    details: {
      test_name: "pipeline.flaky",
      verdict: "flaky",
      failure_rate: 0.38,
      total_runs: 13,
      failures: 5,
      distinct_commits_with_failure: 4,
      details:
        "Failures observed across 4 different commits. This is a non-deterministic (flaky) test, not tied to a specific code change.",
    },
    created_at: new Date(),
  });

  // --- Seed a verification for the failed run (risky verdict) ---
  await db.collection("verifications").insertOne({
    _id: uuidv4(),
    run_id: failedRunId,
    claims: [
      {
        requirement: "Reduce DB connection pool latency by 30%",
        evidence_test: "api.projects.create",
        status: "unproven",
        reason: "Test api.projects.create was not found in run events.",
      },
      {
        requirement: "All existing auth tests pass",
        evidence_test: "auth.login.success",
        status: "blocked",
        reason:
          "Test auth.login.success ran but FAILED. Claim is contradicted by evidence.",
      },
    ],
    verdict: "blocked",
    computed_at: new Date(),
  });

  console.log("✅ Created findings and verifications");
  console.log("\n🎉 Database seeded successfully!");
  console.log(`   Project 1 ID: ${project1Id}`);
  console.log(`   Project 2 ID: ${project2Id}`);
  console.log(`   Failed run ID (for divergence demo): ${failedRunId}`);
  console.log(`\n   Save these IDs for the demo!\n`);

  await client.close();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
