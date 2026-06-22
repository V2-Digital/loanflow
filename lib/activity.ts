import { db, nowIso } from "./db";

// Append a row to the unified activity feed for a loan.
export function logActivity(
  loanId: number,
  actorId: number,
  verb: string,
  summary: string
): void {
  db.prepare(
    "INSERT INTO activity (loanId, actorId, verb, summary, createdAt) VALUES (?,?,?,?,?)"
  ).run(loanId, actorId, verb, summary, nowIso());
}
