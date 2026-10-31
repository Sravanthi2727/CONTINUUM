import { Db } from "mongodb";

export interface FlakyVsRegressionResult {
  test_name: string;
  verdict: "flaky" | "regression" | "stable";
  total_runs: number;
  failures: number;
  failure_rate: number;
  distinct_commits_with_failure: number;
  details: string;
}

/**
 * Pipeline: Flaky vs Regression
 *
 * Looks at all test_result events for a given test_name across runs of a project.
 * If failures happen across many different commits → flaky.
 * If failures are concentrated in few commits (new failures) → regression.
 * If failure_rate < 10% → stable.
 */
export async function flakyVsRegression(
  db: Db,
  test_name: string,
  project_id?: string
): Promise<FlakyVsRegressionResult> {
  // Step 1: Aggregate test_result events for this test name
  const pipeline: any[] = [
    {
      $match: {
        type: "test_result",
        "payload.test_name": test_name,
      },
    },
    {
      $lookup: {
        from: "runs",
        localField: "run_id",
        foreignField: "_id",
        as: "run",
      },
    },
    { $unwind: "$run" },
    ...(project_id
      ? [{ $match: { "run.project_id": project_id } }]
      : []),
    {
      $group: {
        _id: "$payload.status", // "pass" | "fail"
        count: { $sum: 1 },
        commits: { $addToSet: "$run.commit_sha" },
      },
    },
  ];

  const results = await db.collection("events").aggregate(pipeline).toArray();

  const passEntry = results.find((r) => r._id === "pass");
  const failEntry = results.find((r) => r._id === "fail");

  const passes = passEntry?.count ?? 0;
  const failures = failEntry?.count ?? 0;
  const total_runs = passes + failures;
  const failure_rate = total_runs === 0 ? 0 : failures / total_runs;
  // distinct commits that saw failures
  const failCommits: string[] = failEntry?.commits?.filter(Boolean) ?? [];
  const passCommits: string[] = passEntry?.commits?.filter(Boolean) ?? [];
  const distinct_commits_with_failure = new Set(failCommits).size;
  const distinct_commits_total = new Set([...failCommits, ...passCommits]).size;

  let verdict: "flaky" | "regression" | "stable";
  let details: string;

  if (failure_rate < 0.1) {
    verdict = "stable";
    details = `Test passes ${(100 - failure_rate * 100).toFixed(1)}% of the time. No concern.`;
  } else if (distinct_commits_with_failure >= Math.max(2, distinct_commits_total * 0.5)) {
    // Failures spread across many commits → flaky
    verdict = "flaky";
    details = `Failures observed across ${distinct_commits_with_failure} different commits. This is a non-deterministic (flaky) test, not tied to a specific code change.`;
  } else {
    // Failures concentrated in few commits → regression
    verdict = "regression";
    details = `Failures concentrated in ${distinct_commits_with_failure} commit(s). This looks like a regression introduced by a specific change.`;
  }

  // Persist as a Finding
  await db.collection("findings").updateOne(
    { "details.test_name": test_name, type: verdict === "stable" ? "flaky_test" : verdict === "flaky" ? "flaky_test" : "regression" },
    {
      $set: {
        project_id: project_id || "unknown",
        type: verdict === "regression" ? "regression" : "flaky_test",
        details: { test_name, verdict, failure_rate, total_runs, failures, distinct_commits_with_failure, details },
        created_at: new Date(),
      },
    },
    { upsert: true }
  );

  return { test_name, verdict, total_runs, failures, failure_rate, distinct_commits_with_failure, details };
}
