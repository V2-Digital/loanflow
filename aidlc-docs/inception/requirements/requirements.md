# Requirements — LoanFlow

**Depth**: Standard. **Phase**: Inception / Requirements Analysis.

## 1. Problem & Intent

A bank's lending team needs a shared workspace to coordinate a single business loan
from intake through decision. Today this work is spread across email, spreadsheets,
and shared drives, so status is unclear, document requests get lost, and hand-offs
between roles are ambiguous. LoanFlow centralizes the loan's pipeline stage, required
documents, tasks, assigned team members, and discussion in one place.

## 2. Personas

| Persona | Description | Primary needs |
|---------|-------------|---------------|
| Borrower | Authorized representative of the applying business | Submit application, upload requested documents, see status & messages |
| Loan Officer | Owns the relationship and the loan record | Create/advance loan, request docs, assign tasks, message borrower |
| Credit Analyst | Analyzes financials | Review documents, complete analysis tasks, comment |
| Underwriter | Assesses risk and recommends terms | Review package, record underwriting notes, advance/return stage |
| Manager | Approves or declines | See full picture, make final decision, reassign work |

## 3. Functional Requirements

**Loan pipeline (FR-P)**
- FR-P1: A loan progresses through ordered stages: Draft → Submitted → Document Collection → Credit Review → Underwriting → Decision → Closed.
- FR-P2: Authorized roles can advance or return a loan to an adjacent stage; each transition is recorded with actor, timestamp, and optional note.
- FR-P3: A loan captures business name, requested amount, purpose, term, and applicant contact.
- FR-P4: The final Decision stage records an outcome (Approved / Declined / Withdrawn) with a rationale.

**Documents (FR-D)**
- FR-D1: Team members can request a document (name, type, optional due date) on a loan; it starts as "Requested".
- FR-D2: The borrower (or staff) marks a document "Uploaded" (reference implementation stores file metadata, not bytes).
- FR-D3: Staff can mark a document "Approved" or "Rejected" with a note.
- FR-D4: A loan shows outstanding vs. satisfied document requests.

**Tasks (FR-T)**
- FR-T1: Team members create tasks on a loan with title, description, assignee, due date.
- FR-T2: Tasks move To Do → In Progress → Done; the assignee or any staff can update.
- FR-T3: Dashboard surfaces tasks assigned to the current user.

**Team & collaboration (FR-C)**
- FR-C1: Staff can be assigned to a loan with a role on that loan.
- FR-C2: Any participant can post comments on a loan; comments form a chronological thread.
- FR-C3: Every material action (stage change, doc/task/comment, assignment) is written to an activity feed.

**Access & views (FR-A)**
- FR-A1: Mock auth lets the user switch between seeded personas (no passwords).
- FR-A2: Borrowers see only loans they are the applicant on; staff see loans they're assigned to plus (for managers) all loans.
- FR-A3: Dashboard lists the current user's loans with stage, amount, and open-item counts.

## 4. Non-Functional Requirements

- NFR-1 (Usability): Single-purpose screens; loan detail consolidates pipeline, docs, tasks, team, activity.
- NFR-2 (Portability): Runs locally with `npm install && npm run dev`; no external services.
- NFR-3 (Data integrity): Parameterized SQL; server-side validation of inputs and role checks on mutations.
- NFR-4 (Security — directional): Mock auth only. Clearly labeled not-for-production. Role checks demonstrate the pattern but trust the selected session.
- NFR-5 (Maintainability): Typed data layer, thin API routes, server components for reads.

## 5. Acceptance Criteria (representative user stories)

- As a **loan officer**, I can create a loan, assign an underwriter, and request three documents, and the borrower sees those requests. ✅
- As a **borrower**, I can mark a requested document uploaded and post a question, and staff see it in the activity feed. ✅
- As an **underwriter**, I can advance a loan from Underwriting to Decision with a note. ✅
- As a **manager**, I can record an "Approved" decision with rationale and the loan moves to Closed. ✅
- As **any user**, my dashboard shows only the loans and tasks relevant to me. ✅

## 6. Out of Scope

Real authentication/SSO, real file storage, credit-bureau or core-banking
integrations, payments/disbursement, notifications/email, multi-tenant org isolation,
audit-grade compliance. These are noted as extension points.
