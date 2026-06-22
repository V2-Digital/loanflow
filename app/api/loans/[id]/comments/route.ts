import { getCurrentUser, can } from "@/lib/auth";
import { addComment, getLoan, isMember } from "@/lib/repo";
import { ok, bad, forbidden, notFound, requireString, ValidationError } from "@/lib/http";

export const dynamic = "force-dynamic";

// POST { body } — add a comment to the loan thread.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const loan = getLoan(id);
  if (!loan) return notFound();

  const user = getCurrentUser();
  if (!can(user, "comment:create", { loan, isMember: isMember(id, user.id) })) {
    return forbidden();
  }

  try {
    const b = await req.json();
    const comment = addComment(id, requireString(b.body, "body"), user);
    return ok(comment, { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError) return bad(e.message);
    return bad("Could not add comment");
  }
}
