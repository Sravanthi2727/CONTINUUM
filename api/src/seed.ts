import { connectDB, getDB } from './db';
import crypto from 'crypto';

async function seed() {
  await connectDB();
  const db = getDB();

  console.log("Clearing old test data...");
  await db.collection('projects').deleteMany({});
  await db.collection('runs').deleteMany({});
  await db.collection('events').deleteMany({});

  console.log("Generating historical runs...");
  const projectId = crypto.randomUUID();
  
  await db.collection('projects').insertOne({
    _id: projectId,
    owner_id: "demo_user_123",
    name: "Continuum Core",
    instrumentation_enabled: true,
    created_at: new Date()
  });

  const runId = crypto.randomUUID();
  await db.collection('runs').insertOne({
    _id: runId,
    project_id: projectId,
    source: "human",
    triggered_by: "demo_user_123",
    status: "success",
    started_at: new Date(Date.now() - 60000),
    ended_at: new Date()
  });

  await db.collection('events').insertOne({
    _id: crypto.randomUUID(),
    run_id: runId,
    type: "command_run",
    payload: { command: "npm install mongodb express", status: "success" },
    timestamp: new Date(Date.now() - 30000)
  });

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});