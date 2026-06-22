/**
 * Headless smoke test for the data layer + policy (no HTTP, no Next runtime).
 * Run with `npm run smoke`. Exits non-zero on first failed assertion.
 */
import { db } from "../lib/db";
import {
  addMember,
  changeStage,
  createLoan,
  createTask,
  getLoanDetail,
  getUser,
  requestDocument,
  updateDocumentStatus,
} from "../lib/repo";
import { can } from "../lib/policy";
import type { User } from "../lib/types";

let passed = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    console.error(`  ✗ ${name}`);
    process.exitCode = 1;
    throw new Error(`Assertion failed: ${name}`);
  }
}

function wipe() {
  for (const t of [
    "stage_events",
    "activity",
    "comments",
    "tasks",
    "documents",
    "loan_members",
    "loans",
    "users",
  ])
    db.prepare(`DELETE FROM ${t}`).run();
  db.prepare("DELETE FROM sqlite_sequence").run();
}

function mkUser(name: string, role: string): User {
  const info = db
    .prepare("INSERT INTO users (name,email,role,orgName) VALUES (?,?,?,?)")
    .run(name, `${name.replace(/\s/g, "").toLowerCase()}@x.test`, role, "Org");
  return getUser(Number(info.lastInsertRowid))!;
}

console.log("LoanFlow smoke test");
wipe();

const officer = mkUser("Officer", "loan_officer");
const manager = mkUser("Manager", "manager");
const borrower = mkUser("Borrower", "borrower");
const other = mkUser("Other Borrower", "borrower");

// --- Policy ---------------------------------------------------------------
console.log("policy:");
const loan = createLoan(
  {
    businessName: "Test Co",
    amount: 100000,
    purpose: "p",
    termMonths: 36,
    contactName: "B",
    contactEmail: "b@x.test",
    borrowerId: borrower.id,
  },
  officer
);
check("officer can change stage", can(officer, "stage:change", { loan }));
check("borrower cannot change stage", !can(borrower, "stage:change", { loan }));
check("only manager records decision", can(manager, "decision:record", { loan }) && !can(officer, "decision:record", { loan }));
check("borrower sees own loan", can(borrower, "loan:view", { loan }));
check("other borrower cannot see loan", !can(other, "loan:view", { loan }));
check("manager sees any loan", can(manager, "loan:view", { loan }));
check("borrower cannot request docs", !can(borrower, "document:request", { loan }));

// --- Stage machine --------------------------------------------------------
console.log("stage machine:");
const jump = changeStage(loan.id, "underwriting", officer); // from draft — not adjacent
check("non-adjacent jump rejected", !jump.ok);

check("advance to submitted", changeStage(loan.id, "submitted", officer).ok);
check("advance to document_collection", changeStage(loan.id, "document_collection", officer).ok);
check("advance to credit_review", changeStage(loan.id, "credit_review", officer).ok);
check("advance to underwriting", changeStage(loan.id, "underwriting", officer).ok);
check("advance to decision", changeStage(loan.id, "decision", officer).ok);

const closeNoDecision = changeStage(loan.id, "closed", manager); // missing decision
check("close without decision rejected", !closeNoDecision.ok);

const closed = changeStage(loan.id, "closed", manager, { decision: "approved", decisionNote: "ok" });
check("close with decision accepted", closed.ok && closed.loan!.stage === "closed");
check("decision recorded on loan", closed.loan!.decision === "approved");

const afterClosed = changeStage(loan.id, "decision", manager);
check("closed loan is terminal", !afterClosed.ok);

// --- Documents + tasks + aggregate ---------------------------------------
console.log("documents & tasks:");
addMember(loan.id, manager.id, manager.role);
const doc = requestDocument(loan.id, { name: "Tax return", docType: "Tax Return" }, officer);
check("doc starts requested", doc.status === "requested");
const uploaded = updateDocumentStatus(doc.id, "uploaded", borrower);
check("doc can be uploaded", uploaded.status === "uploaded");
const approved = updateDocumentStatus(doc.id, "approved", officer, "fine");
check("doc can be approved", approved.status === "approved");

const task = createTask(loan.id, { title: "Review", assigneeId: manager.id }, officer);
check("task created as todo", task.status === "todo");

const detail = getLoanDetail(loan.id)!;
check("aggregate has documents", detail.documents.length === 1);
check("aggregate has tasks", detail.tasks.length === 1);
check("activity feed populated", detail.activity.length > 0);
check("stage events recorded", detail.stageEvents.length >= 7);

wipe(); // leave DB clean for a fresh `npm run seed`
console.log(`\nAll ${passed} checks passed.`);
