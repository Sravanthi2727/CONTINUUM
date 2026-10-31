import { Db } from "mongodb";

export interface ProjectHistoryResult {
  project: any;
  runs: Array<{
    run: any;
    events: any[];
    verdict?: any;
    divergence?: any;
  }>;
}

/**
 * MCP Tool: getProjectHistory
 * Returns the N most recent runs for a project, with their events and any verdicts.
 */
export async function getProjectHistory(
  db: Db,
  project_id: string,
  limit = 10
): Promise<ProjectHistoryResult> {
  const project = await db.collection("projects").findOne({ _id: project_id } as any);

  const runs = await db
    .collection("runs")
    .find({ project_id } as any)
    .sort({ started_at: -1 })
    .limit(limit)
    .toArray();

  const enrichedRuns = await Promise.all(
    runs.map(async (run) => {
      const [events, verdict, divergence] = await Promise.all([
        db.collection("events").find({ run_id: String(run._id) } as any).sort({ step: 1 }).toArray(),
        db.collection("verifications").findOne({ run_id: String(run._id) } as any),
        db.collection("findings").findOne({ "details.run_id": String(run._id), type: "divergence" } as any),
      ]);
      return { run, events, verdict, divergence };
    })
  );

  return { project, runs: enrichedRuns };
}
