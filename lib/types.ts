// Domain types for LoanFlow. Single source of truth for enums + row shapes.

export const ROLES = [
  "borrower",
  "loan_officer",
  "credit_analyst",
  "underwriter",
  "manager",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  borrower: "Borrower",
  loan_officer: "Loan Officer",
  credit_analyst: "Credit Analyst",
  underwriter: "Underwriter",
  manager: "Manager",
};

// Ordered pipeline stages. Index = position in the pipeline.
export const STAGES = [
  "draft",
  "submitted",
  "document_collection",
  "credit_review",
  "underwriting",
  "decision",
  "closed",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  draft: "Draft",
  submitted: "Submitted",
  document_collection: "Document Collection",
  credit_review: "Credit Review",
  underwriting: "Underwriting",
  decision: "Decision",
  closed: "Closed",
};

export const DECISIONS = ["approved", "declined", "withdrawn"] as const;
export type Decision = (typeof DECISIONS)[number];

export const DOC_STATUSES = ["requested", "uploaded", "approved", "rejected"] as const;
export type DocStatus = (typeof DOC_STATUSES)[number];

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  orgName: string;
}

export interface Loan {
  id: number;
  businessName: string;
  amount: number;
  purpose: string;
  termMonths: number;
  contactName: string;
  contactEmail: string;
  stage: Stage;
  decision: Decision | null;
  decisionNote: string | null;
  borrowerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoanMember {
  id: number;
  loanId: number;
  userId: number;
  roleOnLoan: Role;
}

export interface Document {
  id: number;
  loanId: number;
  name: string;
  docType: string;
  status: DocStatus;
  note: string | null;
  requestedById: number;
  uploadedById: number | null;
  dueDate: string | null;
  updatedAt: string;
}

export interface Task {
  id: number;
  loanId: number;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: number | null;
  createdById: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  loanId: number;
  authorId: number;
  body: string;
  createdAt: string;
}

export interface Activity {
  id: number;
  loanId: number;
  actorId: number;
  verb: string;
  summary: string;
  createdAt: string;
}

export interface StageEvent {
  id: number;
  loanId: number;
  fromStage: Stage | null;
  toStage: Stage;
  actorId: number;
  note: string | null;
  createdAt: string;
}

// Convenience composite returned by the repo for the loan detail page.
export interface LoanDetail extends Loan {
  borrower: User;
  members: (LoanMember & { user: User })[];
  documents: Document[];
  tasks: Task[];
  comments: (Comment & { author: User })[];
  activity: (Activity & { actor: User })[];
  stageEvents: (StageEvent & { actor: User })[];
}
