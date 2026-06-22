"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "./api";
import { Avatar } from "./Avatar";
import { StageBar } from "./StageBar";
import {
  DECISIONS,
  ROLE_LABEL,
  STAGE_LABEL,
  type Decision,
  type LoanDetail,
  type Stage,
  type TaskStatus,
  type User,
} from "@/lib/types";
import {
  money,
  date,
  dateTime,
  docStatusChip,
  taskStatusChip,
  taskStatusLabel,
} from "@/lib/format";

interface Perms {
  changeStage: boolean;
  decide: boolean;
  requestDoc: boolean;
  reviewDoc: boolean;
  upload: boolean;
  createTask: boolean;
  comment: boolean;
  assignMember: boolean;
  isStaff: boolean;
}

const TABS = ["Overview", "Documents", "Tasks", "Team", "Activity"] as const;
type Tab = (typeof TABS)[number];

export function LoanWorkspace(props: {
  loan: LoanDetail;
  currentUser: User;
  assignable: User[];
  staff: User[];
  nextStage: Stage | null;
  prevStage: Stage | null;
  perms: Perms;
}) {
  const { loan, currentUser, assignable, staff, nextStage, prevStage, perms } = props;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Overview");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const openDocs = loan.documents.filter((d) => d.status === "requested" || d.status === "rejected").length;
  const openTasks = loan.tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-slate-500 hover:text-brand-700">
        ← Back to pipeline
      </Link>

      {/* Header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{loan.businessName}</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">{loan.purpose}</p>
            <p className="mt-2 text-xs text-slate-400">
              Borrower: {loan.borrower.name} · {loan.contactEmail}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">{money(loan.amount)}</div>
            <div className="text-xs text-slate-400">{loan.termMonths} month term</div>
            {loan.decision && (
              <span className="chip mt-2 bg-slate-100 capitalize text-slate-700">
                Decision: {loan.decision}
              </span>
            )}
          </div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <StageBar stage={loan.stage} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => {
          const count =
            t === "Documents" ? openDocs : t === "Tasks" ? openTasks : 0;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                tab === t
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t}
              {count > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-xs text-amber-800">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "Overview" && (
        <OverviewTab loan={loan} perms={perms} nextStage={nextStage} prevStage={prevStage} busy={busy} run={run} />
      )}
      {tab === "Documents" && (
        <DocumentsTab loan={loan} perms={perms} currentUser={currentUser} busy={busy} run={run} />
      )}
      {tab === "Tasks" && (
        <TasksTab loan={loan} perms={perms} currentUser={currentUser} assignable={assignable} busy={busy} run={run} />
      )}
      {tab === "Team" && (
        <TeamTab loan={loan} perms={perms} staff={staff} busy={busy} run={run} />
      )}
      {tab === "Activity" && (
        <ActivityTab loan={loan} perms={perms} busy={busy} run={run} />
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
function OverviewTab({
  loan,
  perms,
  nextStage,
  prevStage,
  busy,
  run,
}: {
  loan: LoanDetail;
  perms: Perms;
  nextStage: Stage | null;
  prevStage: Stage | null;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<Decision>("approved");
  const atDecision = loan.stage === "decision";
  const closed = loan.stage === "closed";

  function advance() {
    if (!nextStage) return;
    run(() => api(`/api/loans/${loan.id}/stage`, "POST", { toStage: nextStage, note: note || undefined }));
    setNote("");
  }
  function regress() {
    if (!prevStage) return;
    run(() => api(`/api/loans/${loan.id}/stage`, "POST", { toStage: prevStage, note: note || undefined }));
    setNote("");
  }
  function recordDecision() {
    run(() =>
      api(`/api/loans/${loan.id}/stage`, "POST", {
        toStage: "closed",
        decision,
        decisionNote: note || undefined,
      })
    );
    setNote("");
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      <div className="space-y-5 md:col-span-2">
        {/* Stage controls */}
        {perms.changeStage && !closed && (
          <section className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Pipeline actions</h2>

            {atDecision ? (
              perms.decide ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Record the final decision to close this loan.
                  </p>
                  <div className="flex gap-2">
                    {DECISIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDecision(d)}
                        className={`chip capitalize ${
                          decision === d
                            ? "bg-brand-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Decision rationale (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <button className="btn-primary" disabled={busy} onClick={recordDecision}>
                    Record decision &amp; close
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Awaiting a manager to record the final decision.
                </p>
              )
            ) : (
              <div className="space-y-3">
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Optional note for this transition"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex gap-2">
                  {nextStage && (
                    <button className="btn-primary" disabled={busy} onClick={advance}>
                      Advance to {STAGE_LABEL[nextStage]}
                    </button>
                  )}
                  {prevStage && (
                    <button className="btn-ghost" disabled={busy} onClick={regress}>
                      Return to {STAGE_LABEL[prevStage]}
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Stage history */}
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Stage history</h2>
          <ol className="space-y-3">
            {loan.stageEvents.map((s) => (
              <li key={s.id} className="flex gap-3 text-sm">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                <div>
                  <div>
                    <span className="font-medium">
                      {s.fromStage ? `${STAGE_LABEL[s.fromStage]} → ` : ""}
                      {STAGE_LABEL[s.toStage]}
                    </span>{" "}
                    <span className="text-slate-400">· {s.actor.name}</span>
                  </div>
                  {s.note && <div className="text-slate-500">{s.note}</div>}
                  <div className="text-xs text-slate-400">{dateTime(s.createdAt)}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Facts */}
      <aside className="space-y-3">
        <section className="card p-4 text-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Details</h2>
          <Fact label="Stage" value={STAGE_LABEL[loan.stage]} />
          <Fact label="Amount" value={money(loan.amount)} />
          <Fact label="Term" value={`${loan.termMonths} months`} />
          <Fact label="Borrower" value={loan.borrower.orgName} />
          <Fact label="Contact" value={loan.contactName} />
          <Fact label="Opened" value={date(loan.createdAt)} />
          <Fact label="Updated" value={date(loan.updatedAt)} />
          {loan.decisionNote && <Fact label="Decision note" value={loan.decisionNote} />}
        </section>
      </aside>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-700">{value}</span>
    </div>
  );
}

// --------------------------------------------------------------------------
function DocumentsTab({
  loan,
  perms,
  currentUser,
  busy,
  run,
}: {
  loan: LoanDetail;
  perms: Perms;
  currentUser: User;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [docType, setDocType] = useState("Financial Statement");

  function requestDoc() {
    if (!name.trim()) return;
    run(() => api(`/api/loans/${loan.id}/documents`, "POST", { name, docType }));
    setName("");
  }
  function setStatus(docId: number, status: string) {
    run(() => api(`/api/documents/${docId}`, "PATCH", { status }));
  }

  const ownLoan = loan.borrowerId === currentUser.id;

  return (
    <div className="space-y-4">
      {perms.requestDoc && (
        <section className="card flex flex-wrap items-end gap-3 p-4">
          <div className="grow">
            <label className="label">Request a document</label>
            <input
              className="input"
              placeholder="e.g. Last 2 years tax returns"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={docType} onChange={(e) => setDocType(e.target.value)}>
              {["Financial Statement", "Tax Return", "Business Plan", "Legal", "Bank Statement", "Other"].map(
                (t) => (
                  <option key={t}>{t}</option>
                )
              )}
            </select>
          </div>
          <button className="btn-primary" disabled={busy} onClick={requestDoc}>
            Request
          </button>
        </section>
      )}

      <section className="card divide-y divide-slate-100">
        {loan.documents.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">No documents requested yet.</p>
        )}
        {loan.documents.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{d.name}</span>
                <span className={`chip ${docStatusChip[d.status]} capitalize`}>{d.status}</span>
              </div>
              <div className="text-xs text-slate-400">
                {d.docType}
                {d.dueDate ? ` · due ${date(d.dueDate)}` : ""}
                {d.note ? ` · ${d.note}` : ""}
              </div>
            </div>
            <div className="flex gap-2">
              {(d.status === "requested" || d.status === "rejected") &&
                (perms.upload && (ownLoan || perms.isStaff)) && (
                  <button className="btn-ghost" disabled={busy} onClick={() => setStatus(d.id, "uploaded")}>
                    Mark uploaded
                  </button>
                )}
              {d.status === "uploaded" && perms.reviewDoc && (
                <>
                  <button
                    className="btn-ghost text-emerald-700"
                    disabled={busy}
                    onClick={() => setStatus(d.id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-ghost text-rose-700"
                    disabled={busy}
                    onClick={() => setStatus(d.id, "rejected")}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

// --------------------------------------------------------------------------
function TasksTab({
  loan,
  perms,
  currentUser,
  assignable,
  busy,
  run,
}: {
  loan: LoanDetail;
  perms: Perms;
  currentUser: User;
  assignable: User[];
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");

  const byId = new Map(assignable.map((u) => [u.id, u]));

  function createTask() {
    if (!title.trim()) return;
    run(() =>
      api(`/api/loans/${loan.id}/tasks`, "POST", {
        title,
        assigneeId: assigneeId ? Number(assigneeId) : null,
        dueDate: dueDate || null,
      })
    );
    setTitle("");
    setAssigneeId("");
    setDueDate("");
  }
  function move(taskId: number, status: TaskStatus) {
    run(() => api(`/api/tasks/${taskId}`, "PATCH", { status }));
  }

  return (
    <div className="space-y-4">
      {perms.createTask && (
        <section className="card flex flex-wrap items-end gap-3 p-4">
          <div className="grow">
            <label className="label">New task</label>
            <input
              className="input"
              placeholder="e.g. Spread financials and compute DSCR"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Assign to</label>
            <select className="input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {assignable.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({ROLE_LABEL[u.role]})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Due</label>
            <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={busy} onClick={createTask}>
            Add
          </button>
        </section>
      )}

      <section className="card divide-y divide-slate-100">
        {loan.tasks.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">No tasks yet.</p>
        )}
        {loan.tasks.map((t) => {
          const assignee = t.assigneeId ? byId.get(t.assigneeId) : undefined;
          const canUpdate = perms.isStaff || t.assigneeId === currentUser.id || loan.borrowerId === currentUser.id;
          return (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                {assignee ? (
                  <Avatar name={assignee.name} id={assignee.id} />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-xs text-slate-400">
                    ?
                  </span>
                )}
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-slate-400">
                    {assignee ? assignee.name : "Unassigned"}
                    {t.dueDate ? ` · due ${date(t.dueDate)}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`chip ${taskStatusChip[t.status]}`}>{taskStatusLabel[t.status]}</span>
                {canUpdate && (
                  <select
                    className="input w-auto py-1"
                    value={t.status}
                    disabled={busy}
                    onChange={(e) => move(t.id, e.target.value as TaskStatus)}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

// --------------------------------------------------------------------------
function TeamTab({
  loan,
  perms,
  staff,
  busy,
  run,
}: {
  loan: LoanDetail;
  perms: Perms;
  staff: User[];
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [userId, setUserId] = useState("");
  const memberIds = new Set(loan.members.map((m) => m.userId));
  const available = staff.filter((s) => !memberIds.has(s.id));

  function assign() {
    if (!userId) return;
    run(() => api(`/api/loans/${loan.id}/members`, "POST", { userId: Number(userId) }));
    setUserId("");
  }

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Loan team</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <Avatar name={loan.borrower.name} id={loan.borrower.id} />
            <div>
              <div className="text-sm font-medium">{loan.borrower.name}</div>
              <div className="text-xs text-slate-400">Borrower · {loan.borrower.orgName}</div>
            </div>
          </li>
          {loan.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <Avatar name={m.user.name} id={m.user.id} />
              <div>
                <div className="text-sm font-medium">{m.user.name}</div>
                <div className="text-xs text-slate-400">{ROLE_LABEL[m.user.role]}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {perms.assignMember && available.length > 0 && (
        <section className="card flex flex-wrap items-end gap-3 p-4">
          <div className="grow">
            <label className="label">Assign a team member</label>
            <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Select staff…</option>
              {available.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {ROLE_LABEL[s.role]}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary" disabled={busy} onClick={assign}>
            Assign
          </button>
        </section>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
function ActivityTab({
  loan,
  perms,
  busy,
  run,
}: {
  loan: LoanDetail;
  perms: Perms;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [body, setBody] = useState("");

  function post() {
    if (!body.trim()) return;
    run(() => api(`/api/loans/${loan.id}/comments`, "POST", { body }));
    setBody("");
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* Comments */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Discussion</h2>
        <ul className="space-y-3">
          {loan.comments.length === 0 && (
            <li className="text-sm text-slate-400">No comments yet.</li>
          )}
          {loan.comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar name={c.author.name} id={c.author.id} />
              <div>
                <div className="text-sm">
                  <span className="font-medium">{c.author.name}</span>{" "}
                  <span className="text-xs text-slate-400">{dateTime(c.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
        {perms.comment && (
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <textarea
              className="input"
              rows={2}
              placeholder="Add a comment…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <button className="btn-primary" disabled={busy} onClick={post}>
              Post comment
            </button>
          </div>
        )}
      </section>

      {/* Activity feed */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Activity feed</h2>
        <ul className="space-y-3">
          {loan.activity.map((a) => (
            <li key={a.id} className="flex gap-3 text-sm">
              <Avatar name={a.actor.name} id={a.actor.id} size={6} />
              <div>
                <span className="font-medium">{a.actor.name}</span>{" "}
                <span className="text-slate-600">{a.summary}</span>
                <div className="text-xs text-slate-400">{dateTime(a.createdAt)}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
