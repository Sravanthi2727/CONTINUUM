import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { getCollection } from "../db/mongo";
import { Run } from "../types";

const router = Router();

// GET /runs?project_id=xxx
router.get("/", async (req: Request, res: Response) => {
  try {
    const col = getCollection<Run>("runs");
    const filter: any = {};
    if (req.query.project_id) filter.project_id = req.query.project_id;
    const runs = await col.find(filter).sort({ started_at: -1 }).limit(50).toArray();
    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /runs/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const col = getCollection<Run>("runs");
    const run = await col.findOne({ _id: req.params.id });
    if (!run) return res.status(404).json({ error: "Run not found" });
    res.json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /runs/:id/events - convenience endpoint for dashboard
router.get("/:id/events", async (req: Request, res: Response) => {
  try {
    const eventsCol = getCollection<any>("events");
    const events = await eventsCol.find({ run_id: req.params.id }).sort({ step: 1, timestamp: 1 }).toArray();
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /runs/:id/divergence - convenience endpoint for dashboard
router.get("/:id/divergence", async (req: Request, res: Response) => {
  try {
    const { runDivergence } = await import("../intelligence/runDivergence");
    const { getDB } = await import("../db/mongo");
    const result = await runDivergence(getDB(), req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /runs/:id/similar - convenience endpoint for dashboard
router.get("/:id/similar", async (req: Request, res: Response) => {
  try {
    const eventsCol = getCollection<any>("events");
    const errorEvent = await eventsCol.findOne({ run_id: req.params.id, error_message: { $exists: true, $ne: "" } });
    if (!errorEvent) return res.json([]);
    const { similarFailures } = await import("../intelligence/similarFailures");
    const { getDB } = await import("../db/mongo");
    const result = await similarFailures(getDB(), errorEvent.error_message);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /runs/:id/findings - convenience endpoint for dashboard
router.get("/:id/findings", async (req: Request, res: Response) => {
  try {
    const { getDB } = await import("../db/mongo");
    const findingsCol = getDB().collection("findings");
    const findings = await findingsCol.find({
      $or: [
        { "details.run_id": req.params.id },
        { "details.baseline_run_id": req.params.id },
        { run_id: req.params.id }
      ]
    }).toArray();
    res.json(findings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /runs
router.post("/", async (req: Request, res: Response) => {
  try {
    const { project_id, source, agent_name, triggered_by, commit_sha, task_description } = req.body;
    if (!project_id || !source) {
      return res.status(400).json({ error: "project_id and source are required" });
    }

    const run: Run = {
      _id: uuidv4(),
      project_id,
      source,
      agent_name,
      triggered_by: triggered_by || "demo",
      commit_sha,
      task_description,
      status: "running",
      started_at: new Date(),
    };

    const col = getCollection<Run>("runs");
    await col.insertOne(run as any);
    res.status(201).json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH or POST /runs/:id — update status
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const col = getCollection<Run>("runs");
    const { status } = req.body;
    const update: any = { status };
    if (status === "success" || status === "failed") {
      update.ended_at = new Date();
    }
    await col.updateOne({ _id: req.params.id } as any, { $set: update });
    const updated = await col.findOne({ _id: req.params.id } as any);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id", async (req: Request, res: Response) => {
  try {
    const col = getCollection<Run>("runs");
    const { status } = req.body;
    const update: any = { status };
    if (status === "success" || status === "failed") {
      update.ended_at = new Date();
    }
    await col.updateOne({ _id: req.params.id } as any, { $set: update });
    const updated = await col.findOne({ _id: req.params.id } as any);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /runs/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { getDB } = await import("../db/mongo");
    const db = getDB();
    const runId = req.params.id;

    const runRes = await db.collection("runs").deleteOne({ _id: runId } as any);
    if (runRes.deletedCount === 0) {
      return res.status(404).json({ error: "Run not found" });
    }

    await db.collection("events").deleteMany({ run_id: runId });
    await db.collection("findings").deleteMany({
      $or: [
        { "details.run_id": runId },
        { "details.baseline_run_id": runId },
        { run_id: runId },
      ],
    });
    await db.collection("verifications").deleteMany({ run_id: runId });

    res.json({ message: "Run and events deleted successfully", run_id: runId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
