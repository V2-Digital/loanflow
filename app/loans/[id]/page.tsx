import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser, can, isStaff } from "@/lib/auth";
import { getLoanDetail, isMember, listStaff, getUser } from "@/lib/repo";
import { STAGES, type Stage, type User } from "@/lib/types";
import { LoanWorkspace } from "@/components/LoanWorkspace";

export const dynamic = "force-dynamic";

export default async function LoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  const detail = getLoanDetail(id);
  if (!detail) notFound();

  const user = await getCurrentUser();
  const member = isMember(id, user.id);
  if (!can(user, "loan:view", { loan: detail, isMember: member })) {
    return (
      <div className="card p-8 text-center text-sm text-slate-500">
        You don&apos;t have access to this loan.{" "}
        <Link href="/" className="text-brand-700 underline">
          Back to pipeline
        </Link>
      </div>
    );
  }

  const idx = STAGES.indexOf(detail.stage);
  const nextStage: Stage | null = idx < STAGES.length - 1 ? STAGES[idx + 1] : null;
  const prevStage: Stage | null = idx > 0 ? STAGES[idx - 1] : null;

  // Users that can be assigned tasks: all staff plus the borrower.
  const assignable: User[] = [...listStaff(), getUser(detail.borrowerId)!];

  const perms = {
    changeStage: can(user, "stage:change", { loan: detail, isMember: member }),
    decide: can(user, "decision:record", { loan: detail }),
    requestDoc: can(user, "document:request", { loan: detail, isMember: member }),
    reviewDoc: can(user, "document:review", { loan: detail, isMember: member }),
    upload: can(user, "document:upload", { loan: detail, isMember: member }),
    createTask: can(user, "task:create", { loan: detail, isMember: member }),
    comment: can(user, "comment:create", { loan: detail, isMember: member }),
    assignMember: can(user, "member:assign", { loan: detail, isMember: member }),
    isStaff: isStaff(user.role),
  };

  return (
    <LoanWorkspace
      loan={detail}
      currentUser={user}
      assignable={assignable}
      staff={listStaff()}
      nextStage={nextStage}
      prevStage={prevStage}
      perms={perms}
    />
  );
}
