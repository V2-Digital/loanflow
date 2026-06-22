/**
 * Seed script — wipes and repopulates the SQLite database with demo personas
 * and two example loans. Run with `npm run seed` (or `npm run db:reset`).
 */
import { db, nowIso } from "../lib/db";
import {
  addComment,
  addMember,
  changeStage,
  createLoan,
  createTask,
  getUser,
  requestDocument,
  updateDocumentStatus,
  updateTask,
} from "../lib/repo";
import type { User } from "../lib/types";

function reset() {
  for (const t of [
    "stage_events",
    "activity",
    "comments",
    "tasks",
    "documents",
    "loan_members",
    "loans",
    "users",
  ]) {
    db.prepare(`DELETE FROM ${t}`).run();
  }
  db.prepare("DELETE FROM sqlite_sequence").run();
}

function addUser(name: string, email: string, role: string, orgName: string): User {
  const info = db
    .prepare("INSERT INTO users (name, email, role, orgName) VALUES (?,?,?,?)")
    .run(name, email, role, orgName);
  return getUser(Number(info.lastInsertRowid))!;
}

function main() {
  reset();
  const BANK = "Cascade Commercial Bank";

  const officer = addUser("Priya Nair", "priya@cascadebank.com", "loan_officer", BANK);
  const analyst = addUser("Marcus Lee", "marcus@cascadebank.com", "credit_analyst", BANK);
  const underwriter = addUser("Dana Okafor", "dana@cascadebank.com", "underwriter", BANK);
  const manager = addUser("Sam Whitfield", "sam@cascadebank.com", "manager", BANK);
  const borrower1 = addUser("Jordan Reyes", "jordan@brightside.co", "borrower", "Brightside Bakery LLC");
  const borrower2 = addUser("Alex Kim", "alex@northloop.io", "borrower", "North Loop Robotics Inc");

  // ---- Loan 1: well along the pipeline -------------------------------------
  const loan1 = createLoan(
    {
      businessName: "Brightside Bakery LLC",
      amount: 250000,
      purpose: "Open a second retail location and buy commercial ovens",
      termMonths: 60,
      contactName: borrower1.name,
      contactEmail: borrower1.email,
      borrowerId: borrower1.id,
    },
    officer
  );
  addMember(loan1.id, analyst.id, analyst.role);
  addMember(loan1.id, underwriter.id, underwriter.role);
  addMember(loan1.id, manager.id, manager.role);

  changeStage(loan1.id, "submitted", officer, { note: "Application submitted by borrower" });
  changeStage(loan1.id, "document_collection", officer);

  const d1 = requestDocument(loan1.id, { name: "Last 2 years tax returns", docType: "Tax Return" }, officer);
  const d2 = requestDocument(loan1.id, { name: "12-month P&L statement", docType: "Financial Statement" }, analyst);
  requestDocument(loan1.id, { name: "Business plan for new location", docType: "Business Plan", dueDate: "2026-07-01" }, officer);
  updateDocumentStatus(d1.id, "uploaded", borrower1);
  updateDocumentStatus(d1.id, "approved", analyst, "Clean returns, verified.");
  updateDocumentStatus(d2.id, "uploaded", borrower1);

  createTask(loan1.id, { title: "Run credit pull and spread financials", description: "Analyze DSCR and leverage.", assigneeId: analyst.id, dueDate: "2026-06-28" }, officer);
  const t2 = createTask(loan1.id, { title: "Verify collateral on equipment", assigneeId: underwriter.id }, officer);
  updateTask(t2.id, { status: "in_progress" }, underwriter);

  addComment(loan1.id, "Borrower is responsive — got the tax returns same day. Pushing for the P&L approval next.", officer);
  addComment(loan1.id, "DSCR looks healthy at ~1.4x on preliminary numbers. Will finalize after the P&L is approved.", analyst);

  changeStage(loan1.id, "credit_review", analyst, { note: "Core docs in; starting analysis" });

  // ---- Loan 2: brand new, early stage --------------------------------------
  const loan2 = createLoan(
    {
      businessName: "North Loop Robotics Inc",
      amount: 750000,
      purpose: "Working capital and hiring for a new product line",
      termMonths: 84,
      contactName: borrower2.name,
      contactEmail: borrower2.email,
      borrowerId: borrower2.id,
    },
    officer
  );
  addMember(loan2.id, manager.id, manager.role);
  changeStage(loan2.id, "submitted", officer, { note: "Submitted via intake form" });
  requestDocument(loan2.id, { name: "Articles of incorporation", docType: "Legal" }, officer);
  requestDocument(loan2.id, { name: "Cap table and ownership", docType: "Legal" }, officer);
  createTask(loan2.id, { title: "Schedule intro call with founders", assigneeId: officer.id, dueDate: "2026-06-24" }, officer);
  addComment(loan2.id, "Larger ask and earlier-stage company — expect heavier underwriting.", officer);

  console.log("Seed complete.");
  console.log("Users:");
  for (const u of db.prepare("SELECT id, name, role FROM users ORDER BY id").all() as any[]) {
    console.log(`  #${u.id}  ${u.name}  (${u.role})`);
  }
  console.log(`Loans: ${(db.prepare("SELECT COUNT(*) c FROM loans").get() as any).c}`);
  console.log(`Seeded at ${nowIso()}`);
}

main();
