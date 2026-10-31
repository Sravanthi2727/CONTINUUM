import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { getCollection } from "../db/mongo";
import { Project } from "../types";
import { optionalAuthMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /projects - scoped by user or owner_id query param
router.get("/", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const col = getCollection<Project>("projects");
    const filter: any = {};
    if (req.user?.userId) {
      filter.$or = [{ owner_id: req.user.userId }, { owner_id: "demo" }];
    } else if (req.query.owner_id) {
      filter.owner_id = req.query.owner_id;
    }
    const projects = await col.find(filter).sort({ created_at: -1 }).toArray();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /projects/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const col = getCollection<Project>("projects");
    const project = await col.findOne({ _id: req.params.id } as any);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /projects/:id/runs - convenience endpoint for dashboard
router.get("/:id/runs", async (req: Request, res: Response) => {
  try {
    const runsCol = getCollection<any>("runs");
    const filter: any = { project_id: req.params.id };
    if (req.query.source) filter.source = req.query.source;
    if (req.query.status) filter.status = req.query.status;
    const limit = parseInt(req.query.limit as string) || 50;
    const runs = await runsCol.find(filter).sort({ started_at: -1 }).limit(limit).toArray();
    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /projects
router.post("/", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, repo_url, owner_id } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const project: Project = {
      _id: uuidv4(),
      owner_id: req.user?.userId || owner_id || "demo",
      name,
      repo_url,
      created_at: new Date(),
    };

    const col = getCollection<Project>("projects");
    await col.insertOne(project as any);
    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /projects/:id
router.delete("/:id", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = (await import("../db/mongo")).getDB();
    const projectId = req.params.id;

    // Delete project
    const projRes = await db.collection("projects").deleteOne({ _id: projectId } as any);
    if (projRes.deletedCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Find and cascade delete runs, events, and findings
    const runs = await db.collection("runs").find({ project_id: projectId }).toArray();
    const runIds = runs.map((r: any) => r._id);

    await db.collection("runs").deleteMany({ project_id: projectId });
    if (runIds.length > 0) {
      await db.collection("events").deleteMany({ run_id: { $in: runIds } });
      await db.collection("findings").deleteMany({
        $or: [
          { project_id: projectId },
          { "details.run_id": { $in: runIds } },
          { "details.baseline_run_id": { $in: runIds } },
        ],
      });
      await db.collection("verifications").deleteMany({ run_id: { $in: runIds } });
    }

    res.json({
      message: "Project and associated data successfully deleted",
      deleted_runs: runIds.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
