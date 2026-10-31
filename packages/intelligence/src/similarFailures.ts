import { Db, Document } from "mongodb";

export interface SimilarFailureResult {
  event_id: string;
  run_id: string;
  error_message: string;
  similarity_score: number;
  timestamp: Date;
  run_info?: any;
}

export async function similarFailures(db: Db, error_text: string, limit = 5): Promise<SimilarFailureResult[]> {
  const eventsCol = db.collection("events");

  // Try Atlas Vector Search first
  try {
    const queryEmbedding = textToFakeEmbedding(error_text);
    const pipeline: any[] = [
      { $vectorSearch: { index: "error_embedding_vector_index", path: "error_embedding", queryVector: queryEmbedding, numCandidates: 50, limit } },
      { $match: { error_message: { $exists: true, $ne: null } } },
      { $lookup: { from: "runs", localField: "run_id", foreignField: "_id", as: "run" } },
      { $project: { _id: 1, run_id: 1, error_message: 1, timestamp: 1, run: { $arrayElemAt: ["$run", 0] }, score: { $meta: "vectorSearchScore" } } },
    ];
    const results = await eventsCol.aggregate(pipeline).toArray();
    if (results.length > 0) {
      return results.map((r: Document) => ({
        event_id: String(r._id),
        run_id: String(r.run_id),
        error_message: String(r.error_message),
        similarity_score: Number(r.score ?? 0),
        timestamp: r.timestamp as Date,
        run_info: r.run,
      }));
    }
  } catch (_e) {
    // fallback
  }

  // Keyword fallback
  const errorEvents = await eventsCol.find({ error_message: { $exists: true, $ne: null } } as any).sort({ timestamp: -1 }).limit(100).toArray();
  const queryTokens = tokenize(error_text);

  interface ScoredEvent { _id: any; run_id: any; error_message: any; timestamp: any; score: number; [k: string]: any; }

  const scored: ScoredEvent[] = (errorEvents as Document[])
    .map((e) => {
      const tokens = tokenize(String(e.error_message ?? ""));
      const intersection = queryTokens.filter((t) => tokens.includes(t));
      const union = new Set([...queryTokens, ...tokens]);
      const score = union.size === 0 ? 0 : intersection.length / union.size;
      return { ...e, score } as ScoredEvent;
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const runIds = [...new Set(scored.map((e) => String(e.run_id)))];
  const runs = await db.collection("runs").find({ _id: { $in: runIds } } as any).toArray();
  const runMap: Record<string, any> = Object.fromEntries(runs.map((r) => [String(r._id), r]));

  return scored.map((e) => ({
    event_id: String(e._id),
    run_id: String(e.run_id),
    error_message: String(e.error_message ?? ""),
    similarity_score: Math.round(e.score * 100) / 100,
    timestamp: e.timestamp as Date,
    run_info: runMap[String(e.run_id)],
  }));
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t.length > 2);
}

export function textToFakeEmbedding(text: string): number[] {
  const dim = 128;
  const vec: number[] = [];
  for (let i = 0; i < dim; i++) {
    let h = 0;
    for (let j = 0; j < text.length; j++) {
      h = (h * 31 + text.charCodeAt(j) + i * 17) & 0xffffffff;
    }
    vec.push(((h >>> 0) / 0xffffffff) * 2 - 1);
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return vec.map((v) => (mag === 0 ? 0 : v / mag));
}
