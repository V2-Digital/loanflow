import { db, nowIso } from "./db";
import { logActivity } from "./activity";
import {
  Comment,
  Decision,
  Document,
  DocStatus,
  Loan,
  LoanDetail,
  LoanMember,
  Role,
  Stage,
  STAGES,
  STAGE_LABEL,
  Task,
  TaskStatus,
  User,
} from "./types";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export function listUsers(): User[] {
  return db.prepare("SELECT * FROM users ORDER BY id").all() as User[];
}
export function getUser(id: number): User | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}
export function listStaff(): User[] {
  return db
    .prepare("SELECT * FROM users WHERE role != 'borrower' ORDER BY id")
    .all() as User[];
}

// ---------------------------------------------------------------------------
// Loans + membership
// ---------------------------------------------------------------------------
export function isMember(loanId: number, userId: number): boolean {
  const row = db
    .prepare("SELECT 1 FROM loan_members WHERE loanId = ? AND userId = ?")
    .get(loanId, userId);
  return !!row;
}

export function getLoan(id: number): Loan | undefined {
  return db.prepare("SELECT * FROM loans WHERE id = ?").get(id) as Loan | undefined;
}

// Loans visible to a user, with summary counts for the dashboard.
export interface LoanSummary extends Loan {
  borrowerName: string;
  openTasks: number;
  openDocs: number;
  myTasks: number;
}

export function listLoansForUser(user: User): LoanSummary[] {
  let loans: Loan[];
  if (user.role === "manager") {
    loans = db.prepare("SELECT * FROM loans ORDER BY updatedAt DESC").all() as Loan[];
  } else if (user.role === "borrower") {
    loans = db
      .prepare("SELECT * FROM loans WHERE borrowerId = ? ORDER BY updatedAt DESC")
      .all(user.id) as Loan[];
  } else {
    loans = db
      .prepare(
        `SELECT l.* FROM loans l
         JOIN loan_members m ON m.loanId = l.id
         WHERE m.userId = ? ORDER BY l.updatedAt DESC`
      )
      .all(user.id) as Loan[];
  }
  return loans.map((l) => {
    const borrower = getUser(l.borrowerId);
    const openTasks = (
      db
        .prepare("SELECT COUNT(*) c FROM tasks WHERE loanId = ? AND status != 'done'")
        .get(l.id) as { c: number }
    ).c;
    const openDocs = (
      db
        .prepare(
          "SELECT COUNT(*) c FROM documents WHERE loanId = ? AND status IN ('requested','rejected')"
        )
        .get(l.id) as { c: number }
    ).c;
    const myTasks = (
      db
        .prepare(
          "SELECT COUNT(*) c FROM tasks WHERE loanId = ? AND assigneeId = ? AND status != 'done'"
        )
        .get(l.id, user.id) as { c: number }
    ).c;
    return {
      ...l,
      borrowerName: borrower?.name ?? "Unknown",
      openTasks,
      openDocs,
      myTasks,
    };
  });
}

export interface MyTask extends Task {
  businessName: string;
}
export function listMyOpenTasks(userId: number): MyTask[] {
  return db
    .prepare(
      `SELECT t.*, l.businessName businessName FROM tasks t
       JOIN loans l ON l.id = t.loanId
       WHERE t.assigneeId = ? AND t.status != 'done'
       ORDER BY (t.dueDate IS NULL), t.dueDate`
    )
    .all(userId) as MyTask[];
}

export interface CreateLoanInput {
  businessName: string;
  amount: number;
  purpose: string;
  termMonths: number;
  contactName: string;
  contactEmail: string;
  borrowerId: number;
}

export function createLoan(input: CreateLoanInput, actor: User): Loan {
  const ts = nowIso();
  const info = db
    .prepare(
      `INSERT INTO loans
       (businessName, amount, purpose, termMonths, contactName, contactEmail,
        stage, borrowerId, createdAt, updatedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      input.businessName,
      input.amount,
      input.purpose,
      input.termMonths,
      input.contactName,
      input.contactEmail,
      "draft",
      input.borrowerId,
      ts,
      ts
    );
  const loanId = Number(info.lastInsertRowid);
  // Creator (if staff) becomes a member; record initial stage.
  if (actor.role !== "borrower") {
    addMember(loanId, actor.id, actor.role);
  }
  db.prepare(
    "INSERT INTO stage_events (loanId, fromStage, toStage, actorId, note, createdAt) VALUES (?,?,?,?,?,?)"
  ).run(loanId, null, "draft", actor.id, "Loan created", ts);
  logActivity(loanId, actor.id, "created", `created the loan for ${input.businessName}`);
  return getLoan(loanId)!;
}

export function addMember(loanId: number, userId: number, roleOnLoan: Role): void {
  db.prepare(
    "INSERT OR IGNORE INTO loan_members (loanId, userId, roleOnLoan) VALUES (?,?,?)"
  ).run(loanId, userId, roleOnLoan);
}

export function assignMember(loanId: number, userId: number, actor: User): void {
  const u = getUser(userId);
  if (!u) throw new Error("User not found");
  addMember(loanId, userId, u.role);
  touchLoan(loanId);
  logActivity(loanId, actor.id, "assigned", `assigned ${u.name} (${u.role}) to the loan`);
}

function touchLoan(loanId: number): void {
  db.prepare("UPDATE loans SET updatedAt = ? WHERE id = ?").run(nowIso(), loanId);
}

// ---------------------------------------------------------------------------
// Stage machine
// ---------------------------------------------------------------------------
export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

export interface StageChangeResult {
  ok: boolean;
  error?: string;
  loan?: Loan;
}

/** Move a loan to an adjacent stage. `decision`/`decisionNote` required when
 *  transitioning out of the decision stage into closed. */
export function changeStage(
  loanId: number,
  toStage: Stage,
  actor: User,
  opts: { note?: string; decision?: Decision; decisionNote?: string } = {}
): StageChangeResult {
  const loan = getLoan(loanId);
  if (!loan) return { ok: false, error: "Loan not found" };
  if (loan.stage === "closed") return { ok: false, error: "Loan is closed" };

  const from = stageIndex(loan.stage);
  const to = stageIndex(toStage);
  if (to < 0) return { ok: false, error: "Unknown stage" };
  if (Math.abs(to - from) !== 1) {
    return { ok: false, error: "Can only move to an adjacent stage" };
  }

  // Closing requires a recorded decision.
  if (loan.stage === "decision" && toStage === "closed") {
    if (!opts.decision) {
      return { ok: false, error: "A decision is required before closing" };
    }
  }

  const ts = nowIso();
  if (opts.decision) {
    db.prepare(
      "UPDATE loans SET stage = ?, decision = ?, decisionNote = ?, updatedAt = ? WHERE id = ?"
    ).run(toStage, opts.decision, opts.decisionNote ?? null, ts, loanId);
  } else {
    db.prepare("UPDATE loans SET stage = ?, updatedAt = ? WHERE id = ?").run(
      toStage,
      ts,
      loanId
    );
  }

  db.prepare(
    "INSERT INTO stage_events (loanId, fromStage, toStage, actorId, note, createdAt) VALUES (?,?,?,?,?,?)"
  ).run(loanId, loan.stage, toStage, actor.id, opts.note ?? null, ts);

  const verb = to > from ? "advanced" : "returned";
  let summary = `${verb} the loan to ${STAGE_LABEL[toStage]}`;
  if (opts.decision) summary += ` (decision: ${opts.decision})`;
  logActivity(loanId, actor.id, verb, summary);

  return { ok: true, loan: getLoan(loanId)! };
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------
export function requestDocument(
  loanId: number,
  data: { name: string; docType: string; dueDate?: string | null },
  actor: User
): Document {
  const ts = nowIso();
  const info = db
    .prepare(
      `INSERT INTO documents (loanId, name, docType, status, requestedById, dueDate, updatedAt)
       VALUES (?,?,?,'requested',?,?,?)`
    )
    .run(loanId, data.name, data.docType, actor.id, data.dueDate ?? null, ts);
  touchLoan(loanId);
  logActivity(loanId, actor.id, "requested_doc", `requested document "${data.name}"`);
  return db
    .prepare("SELECT * FROM documents WHERE id = ?")
    .get(Number(info.lastInsertRowid)) as Document;
}

export function updateDocumentStatus(
  docId: number,
  status: DocStatus,
  actor: User,
  note?: string
): Document {
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId) as
    | Document
    | undefined;
  if (!doc) throw new Error("Document not found");
  const ts = nowIso();
  const uploadedById = status === "uploaded" ? actor.id : doc.uploadedById;
  db.prepare(
    "UPDATE documents SET status = ?, note = ?, uploadedById = ?, updatedAt = ? WHERE id = ?"
  ).run(status, note ?? doc.note, uploadedById, ts, docId);
  touchLoan(doc.loanId);
  logActivity(
    doc.loanId,
    actor.id,
    "doc_" + status,
    `marked document "${doc.name}" as ${status}`
  );
  return db.prepare("SELECT * FROM documents WHERE id = ?").get(docId) as Document;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export function createTask(
  loanId: number,
  data: { title: string; description?: string; assigneeId?: number | null; dueDate?: string | null },
  actor: User
): Task {
  const ts = nowIso();
  const info = db
    .prepare(
      `INSERT INTO tasks (loanId, title, description, status, assigneeId, createdById, dueDate, createdAt, updatedAt)
       VALUES (?,?,?,'todo',?,?,?,?,?)`
    )
    .run(
      loanId,
      data.title,
      data.description ?? "",
      data.assigneeId ?? null,
      actor.id,
      data.dueDate ?? null,
      ts,
      ts
    );
  touchLoan(loanId);
  const assignee = data.assigneeId ? getUser(data.assigneeId) : undefined;
  logActivity(
    loanId,
    actor.id,
    "task_created",
    `created task "${data.title}"${assignee ? ` for ${assignee.name}` : ""}`
  );
  return db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(Number(info.lastInsertRowid)) as Task;
}

export function getTask(id: number): Task | undefined {
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task | undefined;
}

export function updateTask(
  taskId: number,
  data: { status?: TaskStatus; assigneeId?: number | null },
  actor: User
): Task {
  const task = getTask(taskId);
  if (!task) throw new Error("Task not found");
  const status = data.status ?? task.status;
  const assigneeId =
    data.assigneeId === undefined ? task.assigneeId : data.assigneeId;
  db.prepare(
    "UPDATE tasks SET status = ?, assigneeId = ?, updatedAt = ? WHERE id = ?"
  ).run(status, assigneeId, nowIso(), taskId);
  touchLoan(task.loanId);
  if (data.status && data.status !== task.status) {
    logActivity(
      task.loanId,
      actor.id,
      "task_" + status,
      `moved task "${task.title}" to ${status.replace("_", " ")}`
    );
  }
  if (data.assigneeId !== undefined && data.assigneeId !== task.assigneeId) {
    const a = data.assigneeId ? getUser(data.assigneeId) : null;
    logActivity(
      task.loanId,
      actor.id,
      "task_assigned",
      `reassigned task "${task.title}"${a ? ` to ${a.name}` : ""}`
    );
  }
  return getTask(taskId)!;
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------
export function addComment(loanId: number, body: string, actor: User): Comment {
  const ts = nowIso();
  const info = db
    .prepare("INSERT INTO comments (loanId, authorId, body, createdAt) VALUES (?,?,?,?)")
    .run(loanId, actor.id, body, ts);
  touchLoan(loanId);
  logActivity(loanId, actor.id, "commented", "posted a comment");
  return db
    .prepare("SELECT * FROM comments WHERE id = ?")
    .get(Number(info.lastInsertRowid)) as Comment;
}

// ---------------------------------------------------------------------------
// Loan detail aggregate
// ---------------------------------------------------------------------------
export function getLoanDetail(id: number): LoanDetail | undefined {
  const loan = getLoan(id);
  if (!loan) return undefined;
  const borrower = getUser(loan.borrowerId)!;

  const members = (
    db.prepare("SELECT * FROM loan_members WHERE loanId = ?").all(id) as LoanMember[]
  ).map((m) => ({ ...m, user: getUser(m.userId)! }));

  const documents = db
    .prepare("SELECT * FROM documents WHERE loanId = ? ORDER BY id")
    .all(id) as Document[];

  const tasks = db
    .prepare("SELECT * FROM tasks WHERE loanId = ? ORDER BY (status='done'), id")
    .all(id) as Task[];

  const comments = (
    db
      .prepare("SELECT * FROM comments WHERE loanId = ? ORDER BY createdAt")
      .all(id) as Comment[]
  ).map((c) => ({ ...c, author: getUser(c.authorId)! }));

  const activity = (
    db
      .prepare("SELECT * FROM activity WHERE loanId = ? ORDER BY createdAt DESC, id DESC")
      .all(id) as import("./types").Activity[]
  ).map((a) => ({ ...a, actor: getUser(a.actorId)! }));

  const stageEvents = (
    db
      .prepare("SELECT * FROM stage_events WHERE loanId = ? ORDER BY createdAt")
      .all(id) as import("./types").StageEvent[]
  ).map((s) => ({ ...s, actor: getUser(s.actorId)! }));

  return { ...loan, borrower, members, documents, tasks, comments, activity, stageEvents };
}
