import { Db } from "mongodb";
import { similarFailures } from "./similarFailures";

export async function findSimilarFailures(db: Db, error_text: string, limit = 5) {
  const results = await similarFailures(db, error_text, limit);
  return {
    query: error_text,
    total_found: results.length,
    results: results.map((r) => ({
      ...r,
      similarity_pct: `${(r.similarity_score * 100).toFixed(1)}%`,
    })),
  };
}
