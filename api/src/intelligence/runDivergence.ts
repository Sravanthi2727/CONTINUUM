import { Db, Document } from "mongodb";

export interface DivergenceResult {
  run_id: string;
  compared_to_run_id: string | null;
  first_mismatch_step: number | null;
  mismatch_details: {
    step: number;
    failed_event_type: string;
    success_event_type: string | null;
    failed_payload: any;
    success_payload: any | null;
    reason: string;
  } | null;
  summary: string;
}

export async function runDivergence(db: Db, run_id: string): Promise<DivergenceResult> {
  const runsCol = db.collection("runs");
  const eventsCol = db.collection("events");

  const failedRun = await runsCol.findOne({ _id: run_id } as any);
  if (!failedRun) {
    return { run_id, compared_to_run_id: null, first_mismatch_step: null, mismatch_details: null, summary: `Run ${run_id} not found.` };
  }

  const lastSuccess = await runsCol.findOne(
    { project_id: failedRun.project_id, status: "success", started_at: { $lt: failedRun.started_at } } as any,
    { sort: { started_at: -1 } }
  );

  if (!lastSuccess) {
    return { run_id, compared_to_run_id: null, first_mismatch_step: null, mismatch_details: null, summary: "No previous successful run found to compare against." };
  }

  const lastSuccessId = String(lastSuccess._id);

  const [failedEvents, successEvents] = await Promise.all([
    eventsCol.find({ run_id } as any).sort({ step: 1, timestamp: 1 }).toArray(),
    eventsCol.find({ run_id: lastSuccessId } as any).sort({ step: 1, timestamp: 1 }).toArray(),
  ]);

  const maxSteps = Math.max(failedEvents.length, successEvents.length);

  for (let i = 0; i < maxSteps; i++) {
    const fe = failedEvents[i] as Document;
    const se = successEvents[i] as Document;

    if (fe && !se) {
      const mismatch = { step: fe.step ?? i, failed_event_type: fe.type, success_event_type: null, failed_payload: fe.payload, success_payload: null, reason: `Failed run has extra event at step ${fe.step ?? i} (${fe.type}) with no counterpart in the successful run.` };
      await persistFinding(db, String(failedRun.project_id), run_id, lastSuccessId, mismatch);
      return { run_id, compared_to_run_id: lastSuccessId, first_mismatch_step: fe.step ?? i, mismatch_details: mismatch, summary: mismatch.reason };
    }

    if (!fe && se) {
      const mismatch = { step: se.step ?? i, failed_event_type: "missing", success_event_type: se.type, failed_payload: null, success_payload: se.payload, reason: `Run stopped at step ${i}. Successful run continued with "${se.type}" at step ${se.step ?? i}.` };
      await persistFinding(db, String(failedRun.project_id), run_id, lastSuccessId, mismatch);
      return { run_id, compared_to_run_id: lastSuccessId, first_mismatch_step: se.step ?? i, mismatch_details: mismatch, summary: mismatch.reason };
    }

    if (fe && se && fe.type !== se.type) {
      const mismatch = { step: fe.step ?? i, failed_event_type: fe.type, success_event_type: se.type, failed_payload: fe.payload, success_payload: se.payload, reason: `Event type mismatch at step ${fe.step ?? i}: failed run emitted "${fe.type}" but successful run had "${se.type}".` };
      await persistFinding(db, String(failedRun.project_id), run_id, lastSuccessId, mismatch);
      return { run_id, compared_to_run_id: lastSuccessId, first_mismatch_step: fe.step ?? i, mismatch_details: mismatch, summary: mismatch.reason };
    }

    if (fe && se && fe.type === "test_result" && fe.payload?.status !== se.payload?.status) {
      const mismatch = { step: fe.step ?? i, failed_event_type: fe.type, success_event_type: se.type, failed_payload: fe.payload, success_payload: se.payload, reason: `Test "${fe.payload?.test_name ?? "unknown"}" at step ${fe.step ?? i}: failed with "${fe.payload?.status}" but previously "${se.payload?.status}". ${fe.error_message ? "Error: " + fe.error_message : ""}` };
      await persistFinding(db, String(failedRun.project_id), run_id, lastSuccessId, mismatch);
      return { run_id, compared_to_run_id: lastSuccessId, first_mismatch_step: fe.step ?? i, mismatch_details: mismatch, summary: mismatch.reason };
    }

    if (fe && se && fe.type === "error") {
      const mismatch = { step: fe.step ?? i, failed_event_type: fe.type, success_event_type: se.type, failed_payload: fe.payload, success_payload: se.payload, reason: `Error event at step ${fe.step ?? i}: ${fe.error_message ?? "unknown error"}.` };
      await persistFinding(db, String(failedRun.project_id), run_id, lastSuccessId, mismatch);
      return { run_id, compared_to_run_id: lastSuccessId, first_mismatch_step: fe.step ?? i, mismatch_details: mismatch, summary: mismatch.reason };
    }
  }

  return { run_id, compared_to_run_id: lastSuccessId, first_mismatch_step: null, mismatch_details: null, summary: "No divergence found — runs look identical." };
}

async function persistFinding(db: Db, project_id: string, run_id: string, compared_run_id: string, mismatch: any) {
  await db.collection("findings").updateOne(
    { "details.run_id": run_id, type: "divergence" } as any,
    { $set: { project_id, type: "divergence", details: { run_id, compared_run_id, ...mismatch }, created_at: new Date() } },
    { upsert: true }
  );
}
