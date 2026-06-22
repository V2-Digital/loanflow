import type { Loan, Role, User } from "./types";

// Pure authorization policy — no framework imports, so it is unit-testable.
// Mirrors the matrix in aidlc-docs/.../application-design.md.

export function isStaff(role: Role): boolean {
  return role !== "borrower";
}

export type Action =
  | "loan:view"
  | "loan:create"
  | "stage:change"
  | "decision:record"
  | "document:request"
  | "document:upload"
  | "document:review"
  | "task:create"
  | "task:update"
  | "comment:create"
  | "member:assign";

export interface PolicyCtx {
  loan?: Loan;
  isMember?: boolean;
}

export function can(user: User, action: Action, ctx: PolicyCtx = {}): boolean {
  const r = user.role;
  const ownsLoan = ctx.loan ? ctx.loan.borrowerId === user.id : false;
  const assigned = ctx.isMember ?? false;

  switch (action) {
    case "loan:view":
      if (!ctx.loan) return true;
      if (r === "manager") return true;
      if (r === "borrower") return ownsLoan;
      return assigned;

    case "loan:create":
      return r === "borrower" || r === "loan_officer" || r === "manager";

    case "stage:change":
      return r === "loan_officer" || r === "underwriter" || r === "manager";

    case "decision:record":
      return r === "manager";

    case "member:assign":
      return r === "loan_officer" || r === "manager";

    case "document:request":
    case "document:review":
    case "task:create":
      return isStaff(r);

    case "document:upload":
      if (r === "borrower") return ownsLoan;
      return isStaff(r);

    case "task:update":
      return true; // route refines: assignee/borrower-on-own/staff

    case "comment:create":
      if (r === "manager") return true;
      if (r === "borrower") return ownsLoan;
      return assigned || isStaff(r);

    default:
      return false;
  }
}
