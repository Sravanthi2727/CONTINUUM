import { Db } from "mongodb";

export interface Claim {
  requirement: string;
  evidence_file?: string;
  evidence_test?: string;
}

export interface ClaimResult extends Claim {
  status: "proven" | "unproven" | "blocked";
  reason: string;
}

export interface ClaimVerificationResult {
  run_id: string;
  claims: ClaimResult[];
  verdict: "safe" | "risky" | "blocked";
  computed_at: Date;
}

/**
 * Pipeline: Claim Verification
 *
 * Cross-checks an agent's claimed requirements/tests against what actually happened:
 * - Looks for diff_submitted events for file evidence
 * - Looks for test_result events for test evidence
 * - Produces proven / unproven / blocked per claim, and a final verdict.
 */
export async function claimVerification(
  db: Db,
  run_id: string,
  claims: Claim[]
): Promise<ClaimVerificationResult> {
  const eventsCol = db.collection("events");

  // Fetch all events for this run
  const events = await eventsCol.find({ run_id }).toArray();
  const diffEvents = events.filter((e) => e.type === "diff_submitted");
  const testEvents = events.filter((e) => e.type === "test_result");

  const claimResults: ClaimResult[] = [];

  for (const claim of claims) {
    let status: "proven" | "unproven" | "blocked" = "unproven";
    let reason = "No matching evidence found in run events.";

    // Check file evidence
    if (claim.evidence_file) {
      const matchingDiff = diffEvents.find((e) =>
        e.payload?.files?.some((f: string) => f.includes(claim.evidence_file!)) ||
        e.payload?.file === claim.evidence_file
      );
      if (matchingDiff) {
        status = "proven";
        reason = `File "${claim.evidence_file}" was modified in a diff_submitted event.`;
      } else {
        status = "unproven";
        reason = `File "${claim.evidence_file}" was claimed to be modified but no diff_submitted event found for it.`;
      }
    }

    // Check test evidence
    if (claim.evidence_test) {
      const matchingTest = testEvents.find((e) =>
        e.payload?.test_name === claim.evidence_test ||
        e.payload?.test_name?.includes(claim.evidence_test!)
      );

      if (matchingTest) {
        if (matchingTest.payload?.status === "pass") {
          status = "proven";
          reason = `Test "${claim.evidence_test}" ran and passed.`;
        } else {
          // Test ran but failed → blocked (contradicts the claim)
          status = "blocked";
          reason = `Test "${claim.evidence_test}" ran but FAILED (${matchingTest.payload?.status}). Claim is contradicted by evidence.`;
        }
      } else if (status !== "proven") {
        status = "unproven";
        reason = `Test "${claim.evidence_test}" was claimed to pass but no test_result event found.`;
      }
    }

    claimResults.push({ ...claim, status, reason });
  }

  // Compute verdict
  let verdict: "safe" | "risky" | "blocked";
  const hasBlocked = claimResults.some((c) => c.status === "blocked");
  const allProven = claimResults.every((c) => c.status === "proven");

  if (hasBlocked) {
    verdict = "blocked";
  } else if (allProven) {
    verdict = "safe";
  } else {
    verdict = "risky";
  }

  const result: ClaimVerificationResult = {
    run_id,
    claims: claimResults,
    verdict,
    computed_at: new Date(),
  };

  // Persist verification
  await db.collection("verifications").updateOne(
    { run_id },
    { $set: result },
    { upsert: true }
  );

  return result;
}
