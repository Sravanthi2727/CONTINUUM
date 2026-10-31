import express from 'express';
import cors from 'cors';
import { connectDB, getDB } from './db';
import { Project, Run, Event } from '../../shared/types';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/projects', async (req, res) => {
  try {
    const db = getDB();
    const project: Project = req.body;
    if (project.created_at) project.created_at = new Date(project.created_at);
    
    await db.collection('projects').insertOne(project);
    res.status(201).send({ message: "Project created", _id: project._id });
  } catch (error) {
    console.error("DB Insert Error (/projects):", error);
    res.status(500).send({ error: "Failed to create project" });
  }
});

app.post('/api/runs', async (req, res) => {
  try {
    const db = getDB();
    const run: Run = req.body;
    if (run.started_at) run.started_at = new Date(run.started_at);
    if (run.ended_at) run.ended_at = new Date(run.ended_at);

    await db.collection('runs').insertOne(run);
    res.status(201).send({ message: "Run logged", _id: run._id });
  } catch (error) {
    console.error("DB Insert Error (/runs):", error);
    res.status(500).send({ error: "Failed to log run" });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const db = getDB();
    const event: Event = req.body;
    if (event.timestamp) event.timestamp = new Date(event.timestamp);

    await db.collection('events').insertOne(event);
    res.status(201).send({ message: "Event logged", _id: event._id });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).send({ error: "Duplicate event skipped" });
    } else {
      console.error("DB Insert Error (/events):", error);
      res.status(500).send({ error: "Failed to log event" });
    }
  }
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Ingestion API running on port ${PORT}`));
});