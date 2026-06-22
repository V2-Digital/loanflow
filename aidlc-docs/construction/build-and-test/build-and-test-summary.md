# Build & Test — LoanFlow

## Build instructions

```bash
npm install          # installs Next.js, React, better-sqlite3 (native), tooling
npm run seed         # initializes data/loanflow.db and seeds demo data
npm run build        # production build / type-check
npm run dev          # local dev server at http://localhost:3000
```

`better-sqlite3` is a native module; `next.config.mjs` marks it as a server external
package so it is not bundled. Node 18+ recommended.

## Manual test plan (smoke)

Switch personas with the top-right "Viewing as" control.

1. **Borrower scope** — as *Jordan Reyes*, the dashboard shows only Brightside Bakery;
   North Loop Robotics is not visible.
2. **Manager scope** — as *Sam Whitfield*, all loans are visible.
3. **Document flow** — as *Jordan*, open the loan → Documents → "Mark uploaded" on a
   requested doc. As *Marcus* (analyst), Approve/Reject appears for uploaded docs.
4. **Task flow** — as *Priya*, create a task assigned to *Dana*; switch to *Dana* and
   move it to In Progress; confirm it appears under "My open tasks".
5. **Pipeline** — advance Brightside through to Underwriting → Decision. As *Sam*,
   record an "Approved" decision; loan moves to Closed and shows the decision.
6. **Authorization** — as a borrower, confirm pipeline action buttons and document
   request UI are hidden; the stage API rejects unauthorized calls with 403.
7. **Activity** — every action above appears in the loan's Activity feed; comments post
   to the Discussion thread.

## Automated smoke test

`scripts/smoke.ts` exercises the data layer directly (no HTTP) to verify the schema,
the stage machine (adjacent-only + decision-on-close), and the authorization policy.
Run:

```bash
npm run smoke
```

## Known limitations

- Mock auth: the selected user is trusted; no credentials or CSRF protection.
- Documents store metadata only (no uploaded bytes).
- Single-node SQLite; not concurrent-write hardened.
