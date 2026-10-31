import { Router, Request, Response } from "express";
import { getCollection } from "../db/mongo";
import { flakyVsRegression } from "../intelligence/flakyVsRegression";
import { runDivergence } from "../intelligence/runDivergence";
import { similarFailures } from "../intelligence/similarFailures";
import { claimVerification } from "../intelligence/claimVerification";
import { getDB } from "../db/mongo";

const router = Router();

// GET /intelligence/flaky?test_name=xxx&project_id=yyy
router.get("/flaky", async (req: Request, res: Response) => {
  try {
    const { test_name, project_id } = req.query as { test_name: string; project_id: string };
    if (!test_name) return res.status(400).json({ error: "test_name required" });
    const db = getDB();
    const result = await flakyVsRegression(db, test_name, project_id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /intelligence/divergence?run_id=xxx
router.get("/divergence", async (req: Request, res: Response) => {
  try {
    const { run_id } = req.query as { run_id: string };
    if (!run_id) return res.status(400).json({ error: "run_id required" });
    const db = getDB();
    const result = await runDivergence(db, run_id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /intelligence/similar?error_text=xxx
router.get("/similar", async (req: Request, res: Response) => {
  try {
    const { error_text } = req.query as { error_text: string };
    if (!error_text) return res.status(400).json({ error: "error_text required" });
    const db = getDB();
    const result = await similarFailures(db, error_text);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /intelligence/verify
router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { run_id, claims } = req.body;
    if (!run_id || !claims) return res.status(400).json({ error: "run_id and claims required" });
    const db = getDB();
    const result = await claimVerification(db, run_id, claims);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
