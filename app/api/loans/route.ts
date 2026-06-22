import { getCurrentUser, can } from "@/lib/auth";
import { createLoan, listLoansForUser } from "@/lib/repo";
import { ok, bad, forbidden, requireString, optInt, ValidationError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return ok(listLoansForUser(user));
}

// Create a loan. Borrowers create their own; staff (officer/manager) can create
// on behalf of a borrower by passing borrowerId.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!can(user, "loan:create")) return forbidden();

  try {
    const b = await req.json();
    const amount = optInt(b.amount);
    const termMonths = optInt(b.termMonths);
    if (amount === null || amount <= 0) return bad("amount must be a positive number");
    if (termMonths === null || termMonths <= 0) return bad("termMonths must be positive");

    const borrowerId =
      user.role === "borrower" ? user.id : optInt(b.borrowerId);
    if (borrowerId === null) return bad("borrowerId is required for staff-created loans");

    const loan = createLoan(
      {
        businessName: requireString(b.businessName, "businessName"),
        amount,
        purpose: requireString(b.purpose, "purpose"),
        termMonths,
        contactName: requireString(b.contactName, "contactName"),
        contactEmail: requireString(b.contactEmail, "contactEmail"),
        borrowerId,
      },
      user
    );
    return ok(loan, { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError) return bad(e.message);
    return bad("Could not create loan");
  }
}
