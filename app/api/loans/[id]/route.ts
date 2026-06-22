import { getCurrentUser, can } from "@/lib/auth";
import { getLoan, getLoanDetail, isMember } from "@/lib/repo";
import { ok, notFound, forbidden } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  const loan = getLoan(id);
  if (!loan) return notFound();
  const user = await getCurrentUser();
  if (!can(user, "loan:view", { loan, isMember: isMember(id, user.id) })) {
    return forbidden();
  }
  return ok(getLoanDetail(id));
}
