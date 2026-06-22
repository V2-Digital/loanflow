import { getCurrentUser, can } from "@/lib/auth";
import { changeStage, getLoan, isMember } from "@/lib/repo";
import { DECISIONS, STAGES } from "@/lib/types";
import { ok, bad, forbidden, notFound, oneOf } from "@/lib/http";

export const dynamic = "force-dynamic";

// POST { toStage, note?, decision?, decisionNote? }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const loan = getLoan(id);
  if (!loan) return notFound();

  const user = getCurrentUser();
  if (!can(user, "stage:change", { loan, isMember: isMember(id, user.id) })) {
    return forbidden();
  }

  const b = await req.json().catch(() => ({}));
  const toStage = oneOf(b.toStage, STAGES);
  if (!toStage) return bad("toStage must be a valid stage");

  const decision = b.decision ? oneOf(b.decision, DECISIONS) : undefined;
  if (b.decision && !decision) return bad("Invalid decision value");

  // Recording a decision is a manager-only action.
  if (decision && !can(user, "decision:record", { loan })) {
    return forbidden("Only a manager can record a decision");
  }

  const result = changeStage(id, toStage, user, {
    note: typeof b.note === "string" ? b.note : undefined,
    decision: decision ?? undefined,
    decisionNote: typeof b.decisionNote === "string" ? b.decisionNote : undefined,
  });

  if (!result.ok) return bad(result.error ?? "Stage change failed");
  return ok(result.loan);
}
