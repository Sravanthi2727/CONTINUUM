import { Router, Request, Response } from "express";
import { getCollection } from "../db/mongo";
import { Event } from "../types";

const router = Router();

// GET /events?run_id=xxx
router.get("/", async (req: Request, res: Response) => {
  try {
    const col = getCollection<Event>("events");
    const filter: any = {};
    if (req.query.run_id) filter.run_id = req.query.run_id;
    const events = await col.find(filter).sort({ step: 1, timestamp: 1 }).toArray();
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /events — with dedup via unique _id
router.post("/", async (req: Request, res: Response) => {
  try {
    const { _id, run_id, type, step, payload, error_message } = req.body;

    if (!_id || !run_id || !type) {
      return res.status(400).json({
        error: "Validation failed: _id (event_id), run_id, and type are required",
        code: "SCHEMA_VIOLATION",
      });
    }

    const col = getCollection<Event>("events");
    const event: Event = {
      _id,
      run_id,
      type,
      step,
      payload: payload || {},
      error_message,
      timestamp: new Date(),
    };

    await col.insertOne(event as any);
    res.status(201).json(event);
  } catch (err: any) {
    // MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Duplicate event rejected",
        code: "DUPLICATE_EVENT",
        event_id: req.body._id,
      });
    }
    // MongoDB schema validation error
    if (err.code === 121) {
      return res.status(422).json({
        error: "Schema validation failed",
        code: "SCHEMA_VIOLATION",
        details: err.message,
      });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
