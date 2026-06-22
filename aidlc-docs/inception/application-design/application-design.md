# Application Design — LoanFlow

## Architecture

Next.js (App Router) full-stack app. Server Components read directly from a typed
SQLite data layer; mutations go through Route Handlers under `app/api/**`. Mock auth
is a signed-free cookie holding the selected user id, read on the server.

```
Browser
  | (RSC render + fetch to /api)
Next.js App Router
  |- app/(server components)  --> lib/repo (typed queries) --> SQLite (data/loanflow.db)
  |- app/api/* (route handlers) --> lib/repo + lib/auth + lib/activity
```

## Domain model (ER, text)

```
User (id, name, email, role, orgName)
   1 ---- * Loan.borrowerId           (borrower owns applications)
   1 ---- * LoanMember.userId          (staff assigned to loans)
   1 ---- * Task.assigneeId

Loan (id, businessName, amount, purpose, termMonths, contactName, contactEmail,
      stage, decision, decisionNote, borrowerId, createdAt, updatedAt)
   1 ---- * LoanMember (userId, roleOnLoan)
   1 ---- * Document
   1 ---- * Task
   1 ---- * Comment
   1 ---- * Activity
   1 ---- * StageEvent

Document (id, loanId, name, docType, status, note, requestedById,
          uploadedById, dueDate, updatedAt)
Task (id, loanId, title, description, status, assigneeId, createdById,
      dueDate, createdAt, updatedAt)
Comment (id, loanId, authorId, body, createdAt)
Activity (id, loanId, actorId, verb, summary, createdAt)
StageEvent (id, loanId, fromStage, toStage, actorId, note, createdAt)
```

## Enumerations & rules

- **Loan.stage**: `draft, submitted, document_collection, credit_review, underwriting, decision, closed` (ordered).
- **Transition rule**: a loan may move to the immediately previous or next stage only (FR-P2). `closed` is terminal. Entering `decision`→`closed` requires a recorded decision.
- **Loan.decision**: `approved, declined, withdrawn` (set at decision stage).
- **Document.status**: `requested, uploaded, approved, rejected`.
- **Task.status**: `todo, in_progress, done`.
- **Role**: `borrower, loan_officer, credit_analyst, underwriter, manager`.

## Authorization matrix (reference)

| Action | borrower | loan_officer | credit_analyst | underwriter | manager |
|--------|:--:|:--:|:--:|:--:|:--:|
| View loan | own only | assigned | assigned | assigned | all |
| Create loan | ✔ (as applicant) | ✔ | – | – | ✔ |
| Advance/return stage | – | ✔ | – | ✔ | ✔ |
| Record decision | – | – | – | – | ✔ |
| Request document | – | ✔ | ✔ | ✔ | ✔ |
| Upload document | ✔ | ✔ | ✔ | ✔ | ✔ |
| Approve/reject document | – | ✔ | ✔ | ✔ | ✔ |
| Create/assign task | – | ✔ | ✔ | ✔ | ✔ |
| Update own task | ✔(if assignee) | ✔ | ✔ | ✔ | ✔ |
| Comment | ✔ | ✔ | ✔ | ✔ | ✔ |
| Assign team member | – | ✔ | – | – | ✔ |

Enforced in `lib/auth.ts#can()` and checked in each route handler.

## Module layout

```
lib/
  db.ts        - opens SQLite, runs migrations, exposes singleton
  schema.ts    - CREATE TABLE statements + enums/constants
  types.ts     - TypeScript domain types
  repo.ts      - typed CRUD + query functions
  auth.ts      - session cookie read/write, current user, can() policy
  activity.ts  - helper to append Activity + StageEvent rows
app/
  layout.tsx, globals.css, page.tsx (dashboard)
  loans/new/page.tsx, loans/[id]/page.tsx (+ tab client component)
  api/session, api/loans, api/loans/[id], .../stage, .../documents,
      .../tasks, .../comments, .../members, api/users
components/  - Header (user switcher), StageBar, DocumentList, TaskList,
              CommentThread, ActivityFeed, NewLoanForm, badges, tabs
scripts/seed.ts - seeds users + two example loans with docs/tasks/comments
```
