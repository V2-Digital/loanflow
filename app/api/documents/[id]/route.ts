import { db } from "@/lib/db";
import { getCurrentUser, can } from "@/lib/auth";
import { getLoan, isMember, updateDocumentStatus } from "@/lib/repo";
import { DOC_STATUSES, type Document } from "@/lib/types";
import { ok, bad, forbidden, notFound, oneOf } from "@/lib/http";

export const dynamic = "force-dynamic";

// PATCH { status, note? } — upload / approve / reject a document.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const docId = Number(params.id);
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId) as
    | Document
    | undefined;
  if (!doc) return notFound();
  const loan = getLoan(doc.loanId)!;

  const b = await req.json().catch(() => ({}));
  const status = oneOf(b.status, DOC_STATUSES);
  if (!status) return bad("status must be one of " + DOC_STATUSES.join(", "));

  const user = getCurrentUser();
  const member = isMember(loan.id, user.id);
  const action = status === "uploaded" ? "document:upload" : "document:review";
  if (!can(user, action, { loan, isMember: member })) return forbidden();

  const updated = updateDocumentStatus(
    docId,
    status,
    user,
    typeof b.note === "string" ? b.note : undefined
  );
  return ok(updated);
}
