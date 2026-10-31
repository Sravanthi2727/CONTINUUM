import { MongoClient, Db, Collection } from "mongodb";
import { Project, Run, Event, Verification, Finding } from "../types";

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;
  const uri = process.env.MONGODB_URI!;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db("continuum");
  await setupCollections(db);
  console.log("✅ Connected to MongoDB Atlas");
  return db;
}

async function setupCollections(db: Db) {
  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name);

  // Create events collection with $jsonSchema validator if not exists
  if (!names.includes("events")) {
    await db.createCollection("events", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["_id", "run_id", "type", "timestamp"],
          additionalProperties: true,
          properties: {
            _id: { bsonType: "string", description: "event_id — must be a string" },
            run_id: { bsonType: "string", description: "run_id must be a string" },
            type: {
              bsonType: "string",
              enum: ["command_run", "tool_call", "diff_submitted", "test_result", "error", "plan_step"],
              description: "type must be one of the allowed values",
            },
            timestamp: { bsonType: "date" },
          },
        },
      },
      validationAction: "error",
    });
    console.log("📋 Created events collection with $jsonSchema validator");
  }

  // Ensure indexes
  const eventsCol = db.collection("events");
  await eventsCol.createIndex({ run_id: 1, step: 1 });

  const runsCol = db.collection("runs");
  await runsCol.createIndex({ project_id: 1, started_at: -1 });
}

export function getDB(): Db {
  if (!db) throw new Error("DB not connected. Call connectDB() first.");
  return db;
}

export function getCollection<T extends object>(name: string): Collection<T> {
  return getDB().collection<T>(name);
}
