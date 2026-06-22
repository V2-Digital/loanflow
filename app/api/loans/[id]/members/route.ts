import { getCurrentUser, can } from "@/lib/auth";
import { assignMember, getLoan, getUser, isMember } from "@/lib/repo";
import { ok, bad, forbidden, notFound, optInt } from "@/lib/http";

export const dynamic = "force-dynamic";

// POST { userId } — assign a staff member to the loan.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const loan = getLoan(id);
  if (!loan) return notFound();

  const user = getCurrentUser();
  if (!can(user, "member:assign", { loan, isMember: isMember(id, user.id) })) {
    return forbidden();
  }

  const b = await req.json().catch(() => ({}));
  const userId = optInt(b.userId);
  if (userId === null) return bad("userId is required");
  const target = getUser(userId);
  if (!target) return bad("Unknown user");
  if (target.role === "borrower") return bad("Borrowers cannot be assigned as staff members");

  assignMember(id, userId, user);
  return ok({ ok: true });
}
