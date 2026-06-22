import { getCurrentUser, can } from "@/lib/auth";
import { getLoan, isMember, requestDocument } from "@/lib/repo";
import { ok, bad, forbidden, notFound, requireString, ValidationError } from "@/lib/http";

export const dynamic = "force-dynamic";

// POST { name, docType, dueDate? } — request a document on a loan.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const loan = getLoan(id);
  if (!loan) return notFound();

  const user = getCurrentUser();
  if (!can(user, "document:request", { loan, isMember: isMember(id, user.id) })) {
    return forbidden();
  }

  try {
    const b = await req.json();
    const doc = requestDocument(
      id,
      {
        name: requireString(b.name, "name"),
        docType: requireString(b.docType, "docType"),
        dueDate: typeof b.dueDate === "string" && b.dueDate ? b.dueDate : null,
      },
      user
    );
    return ok(doc, { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError) return bad(e.message);
    return bad("Could not request document");
  }
}
