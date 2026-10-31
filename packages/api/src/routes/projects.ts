import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { getCollection } from "../db/mongo";
import { Project } from "../types";

const router = Router();

// GET /projects
router.get("/", async (req: Request, res: Response) => {
  try {
    const col = getCollection<Project>("projects");
    const projects = await col.find({}).sort({ created_at: -1 }).toArray();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /projects/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const col = getCollection<Project>("projects");
    const project = await col.findOne({ _id: req.params.id });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /projects
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, repo_url, owner_id } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const project: Project = {
      _id: uuidv4(),
      owner_id: owner_id || "demo",
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

export default router;
