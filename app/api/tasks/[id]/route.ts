import { getCurrentUser, isStaff } from "@/lib/auth";
import { getLoan, getTask, isMember, updateTask } from "@/lib/repo";
import { TASK_STATUSES } from "@/lib/types";
import { ok, bad, forbidden, notFound, oneOf, optInt } from "@/lib/http";

export const dynamic = "force-dynamic";

// PATCH { status?, assigneeId? } — progress or reassign a task.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const taskId = Number(params.id);
  const task = getTask(taskId);
  if (!task) return notFound();
  const loan = getLoan(task.loanId)!;

  const user = getCurrentUser();
  const member = isMember(loan.id, user.id);
  const isAssignee = task.assigneeId === user.id;
  const isOwnerBorrower = loan.borrowerId === user.id;
  // Staff who can see the loan, the assignee, or the borrower on their own loan.
  const allowed = isStaff(user.role) ? member || user.role === "manager" : isAssignee || isOwnerBorrower;
  if (!allowed) return forbidden();

  const b = await req.json().catch(() => ({}));
  const status = b.status !== undefined ? oneOf(b.status, TASK_STATUSES) : undefined;
  if (b.status !== undefined && !status) return bad("Invalid status");

  // Only staff may reassign.
  let assigneeId: number | null | undefined = undefined;
  if (b.assigneeId !== undefined) {
    if (!isStaff(user.role)) return forbidden("Only staff can reassign tasks");
    assigneeId = optInt(b.assigneeId);
  }

  const updated = updateTask(taskId, { status: status ?? undefined, assigneeId }, user);
  return ok(updated);
}
