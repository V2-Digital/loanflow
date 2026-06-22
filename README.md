# LoanFlow — Business Loan Coordination (AI-DLC reference implementation)

A Next.js reference app for a bank where a lending **team coordinates a single
business loan** from intake through decision. It combines a stage-based approval
**pipeline** with **document collection, task tracking, team assignment, and a
discussion/activity feed** — for both the internal bank team and the borrower.

> Built with the **AI-DLC** (AI-Driven Development Life Cycle) methodology. The full
> planning trail lives in [`aidlc-docs/`](./aidlc-docs) (requirements, workflow plan,
> application design, units of work, audit log).

> ⚠️ **Reference / educational only.** Authentication is mocked (a user switcher, no
> passwords) and there is no real file storage. Do not use as-is in production.

## Quick start

```bash
npm install
npm run seed      # creates data/loanflow.db with demo users + two example loans
npm run dev       # http://localhost:3000
```

Use the **"Viewing as"** switcher in the top-right to act as any persona. To reset
demo data at any time: `npm run db:reset`.

## Personas (seeded)

| Persona | Role | Sees |
|---------|------|------|
| Priya Nair | Loan Officer | Loans she's assigned to |
| Marcus Lee | Credit Analyst | Loans he's assigned to |
| Dana Okafor | Underwriter | Loans she's assigned to |
| Sam Whitfield | Manager | All loans; records decisions |
| Jordan Reyes | Borrower (Brightside Bakery) | Their own loan |
| Alex Kim | Borrower (North Loop Robotics) | Their own loan |

## What you can do

- **Pipeline**: walk a loan through Draft → Submitted → Document Collection → Credit
  Review → Underwriting → Decision → Closed. Transitions are adjacent-only and logged;
  the manager records the final Approved/Declined/Withdrawn decision to close.
- **Documents**: staff request documents; the borrower (or staff) marks them uploaded;
  reviewers approve or reject. Outstanding requests surface on the dashboard.
- **Tasks**: create, assign, and progress tasks (To Do → In Progress → Done). Your
  open tasks appear at the top of your dashboard.
- **Team**: officers/managers assign staff to a loan.
- **Collaboration**: comment thread plus a unified activity feed capturing every action.

## Architecture

Next.js App Router + TypeScript. Server Components read directly from a typed SQLite
data layer; mutations go through Route Handlers under `app/api/**`. Authorization is
centralized in `lib/auth.ts#can()`.

```
app/
  page.tsx                 Dashboard (role-scoped loan list + my tasks)
  loans/new/page.tsx       Create loan
  loans/[id]/page.tsx      Loan detail (server) -> LoanWorkspace (client tabs)
  api/**                   REST route handlers (loans, stage, documents, tasks, comments, members, session, users)
components/                Header (user switcher), StageBar, LoanWorkspace, NewLoanForm, Avatar
lib/
  db.ts schema.ts types.ts repo.ts   Typed SQLite data layer
  auth.ts                            Mock session + can() policy
  activity.ts http.ts format.ts      Helpers
scripts/seed.ts            Demo data
aidlc-docs/                AI-DLC planning & build artifacts
```

See [`aidlc-docs/inception/application-design/application-design.md`](./aidlc-docs/inception/application-design/application-design.md)
for the domain model, stage machine, and the full authorization matrix, and
[`aidlc-docs/construction/build-and-test/`](./aidlc-docs/construction/build-and-test)
for build and test instructions.

## Extension points (intentionally out of scope)

Real auth/SSO, real document storage, credit-bureau / core-banking integrations,
notifications/email, disbursement, and multi-tenant org isolation. The `can()` policy
and thin route handlers are structured so these slot in without reworking the UI.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run seed` | Seed demo data |
| `npm run db:reset` | Delete the DB and reseed |
| `npm run lint` | Lint |
