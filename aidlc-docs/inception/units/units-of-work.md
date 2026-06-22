# Units of Work — LoanFlow

Four units. Each is independently reviewable; all share `lib/db.ts` + `lib/repo.ts`.

## U1 — Auth & Session
**Goal**: Mock identity and role switching.
- Users table + seed of 5 personas (one per role) + 1 extra borrower.
- Cookie-based session (`lf_uid`), `getCurrentUser()`, `setSession()`.
- `can(user, action, ctx)` policy implementing the authorization matrix.
- Header user-switcher UI (`/api/session`, `/api/users`).
**Done when**: switching users changes dashboard scope and allowed actions.

## U2 — Loan Pipeline
**Goal**: Loan record + ordered stage machine.
- Loan, StageEvent tables; create/read/list with role scoping.
- Stage transition endpoint enforcing adjacent-only moves + decision capture.
- New-loan form; loan overview with StageBar.
**Done when**: a loan can be created and walked from Draft to Closed with a decision.

## U3 — Documents & Tasks
**Goal**: Coordination of required documents and work items.
- Document table: request → upload → approve/reject, with outstanding counts.
- Task table: todo/in_progress/done, assignee, due date.
- Loan-detail Documents and Tasks tabs; dashboard "My tasks".
**Done when**: a doc can be requested, uploaded, approved; tasks assigned and progressed.

## U4 — Collaboration
**Goal**: Team assignment, comments, and a unified activity feed.
- LoanMember assignment; Comment thread; Activity append on every mutation.
- Team and Activity tabs; comment composer.
**Done when**: assignments, comments, and all U2/U3 actions appear in the activity feed.
