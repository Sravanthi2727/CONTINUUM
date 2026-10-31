import { Db } from "mongodb";

export async function submitRunEventDirect(
  db: Db,
  event: {
    _id: string;
    run_id: string;
    type: string;
    step?: number;
    payload?: Record<string, any>;
    error_message?: string;
  }
) {
  try {
    await db.collection("events").insertOne({
      ...event,
      payload: event.payload || {},
      timestamp: new Date(),
    } as any);
    return { success: true, message: "Event recorded", event };
  } catch (err: any) {
    if (err.code === 11000) {
      return { success: false, code: "DUPLICATE_EVENT", error: "Duplicate event rejected" };
    }
    return { success: false, code: "ERROR", error: err.message };
  }
}
