# LoanFlow

LoanFlow is a **reference implementation** of a Next.js application built with the
**AI-DLC (AI-Driven Development Life Cycle)** methodology.

It models a bank team coordinating a business loan from intake through decision:
pipeline stages, document requests, task ownership, team assignment, comments, and
an activity trail shared between internal bank staff and the borrower.

This repo is intentionally not a production banking product. It is a compact,
runnable example of how AI-DLC can turn a product idea into requirements, design,
units of work, implementation, and verification artifacts that live beside the code.

> Reference / educational only. Authentication is mocked, documents store metadata
> only, and there are no real banking integrations.

## What This Demonstrates

- A full-stack **Next.js App Router** application with TypeScript.
- A local **SQLite** data layer using `better-sqlite3`.
- Mock role-based access for borrower, loan officer, credit analyst, underwriter,
  and manager personas.
- A lending workflow with ordered loan stages, document review, tasks, team
  assignment, comments, and activity logging.
- AI-DLC artifacts checked into the repo so the reasoning behind the implementation
  can be reviewed, not just the final code.

## How AI-DLC Was Used

AI-DLC was used as the delivery process for this repo. The implementation was not
started from a blank coding prompt; it followed a structured path:

1. **Workspace detection** identified this as a greenfield project.
2. **Requirements analysis** captured the lending coordination problem, personas,
   functional requirements, non-functional requirements, acceptance criteria, and
   explicit out-of-scope items.
3. **Workflow planning** translated the product intent into an application flow.
4. **Application design** defined the architecture, domain model, stage machine,
   authorization matrix, and module layout.
5. **Units of work** split the build into reviewable implementation slices.
6. **Construction** implemented the app against those units.
7. **Build and test** documented how to run the app and what smoke checks verify.
8. **Audit logging** recorded the major AI-DLC decisions and delivery steps.

The AI-DLC trail is in [`aidlc-docs/`](./aidlc-docs):

| Artifact | Purpose |
|----------|---------|
| [`aidlc-state.md`](./aidlc-docs/aidlc-state.md) | Current AI-DLC phase/status summary |
| [`audit.md`](./aidlc-docs/audit.md) | Decision and execution log |
| [`requirements.md`](./aidlc-docs/inception/requirements/requirements.md) | Personas, requirements, acceptance criteria, out-of-scope items |
| [`workflow-plan.md`](./aidlc-docs/inception/plans/workflow-plan.md) | Product workflow plan |
| [`application-design.md`](./aidlc-docs/inception/application-design/application-design.md) | Architecture, domain model, authorization matrix |
| [`units-of-work.md`](./aidlc-docs/inception/units/units-of-work.md) | Build units used during construction |
| [`build-and-test-summary.md`](./aidlc-docs/construction/build-and-test/build-and-test-summary.md) | Build, manual smoke, and automated smoke instructions |

## AI-DLC Units Implemented

The build was organized into four implementation units:

| Unit | Implemented scope |
|------|-------------------|
| U1 - Auth & Session | Seeded personas, mock cookie session, user switcher, role policy |
| U2 - Loan Pipeline | Loan creation, role-scoped listing, stage machine, final decision capture |
| U3 - Documents & Tasks | Document request/upload/review flow, task assignment and status updates |
| U4 - Collaboration | Loan team membership, comments, activity feed for material actions |

## What You Can Do

- **Pipeline**: move a loan through Draft -> Submitted -> Document Collection ->
  Credit Review -> Underwriting -> Decision -> Closed. Adjacent-only transitions are
  enforced and logged.
- **Decisioning**: as a manager, record Approved, Declined, or Withdrawn with a
  rationale before closing a loan.
- **Documents**: request documents, mark them uploaded, and approve or reject them.
- **Tasks**: create tasks, assign them to team members, and move them from To Do to
  In Progress to Done.
- **Team**: assign staff members to a loan.
- **Collaboration**: post comments and review the activity feed.
- **Persona testing**: switch between seeded users to see how access changes by role.

## Quick Start

```bash
npm install
npm run seed
npm run dev
```

Open:

```text
http://localhost:3000
```

Use the **Viewing as** switcher in the top-right to act as different personas.

To reset demo data:

```bash
npm run db:reset
```

## Seeded Personas

| Persona | Role | Sees |
|---------|------|------|
| Priya Nair | Loan Officer | Loans she is assigned to |
| Marcus Lee | Credit Analyst | Loans he is assigned to |
| Dana Okafor | Underwriter | Loans she is assigned to |
| Sam Whitfield | Manager | All loans; records decisions |
| Jordan Reyes | Borrower | Brightside Bakery loan |
| Alex Kim | Borrower | North Loop Robotics loan |

## Architecture

LoanFlow is a local full-stack app:

```text
Browser
  -> Next.js App Router
      -> Server Components for reads
      -> Route Handlers under app/api/** for mutations
      -> lib/repo.ts typed data access
      -> SQLite database at data/loanflow.db
```

Important paths:

```text
app/
  page.tsx                 Dashboard
  loans/new/page.tsx       Create loan
  loans/[id]/page.tsx      Loan workspace
  api/**                   Route handlers

components/
  Header.tsx               Persona switcher
  LoanWorkspace.tsx        Loan tabs and client interactions
  StageBar.tsx             Pipeline display
  NewLoanForm.tsx          Loan creation

lib/
  auth.ts                  Mock session and authorization policy
  repo.ts                  Typed SQLite queries and mutations
  schema.ts                Tables and enum constants
  activity.ts              Activity/stage event helpers

scripts/
  seed.ts                  Demo data
  smoke.ts                 Data-layer smoke test
```

## What Has Not Been Built With AI-DLC

These areas were either skipped, explicitly scoped out, or only handled
directionally. They are the most important boundaries of this reference app:

| Area | Current state | What remains |
|------|---------------|--------------|
| Real authentication | Mock persona switcher using a trusted cookie | SSO/OIDC, passwords or passkeys, session hardening, CSRF protection |
| Real document storage | Document metadata only | File upload, virus scanning, object storage, permissions, retention |
| Banking integrations | None | Core banking, CRM, credit bureau, KYC/KYB, financial spreading, document providers |
| Production security | Directional role checks only | Threat model, security review, rate limits, audit-grade logging, secrets handling |
| Compliance | Not implemented | GLBA/Privacy Act, PCI if payments appear, bank policy controls, retention rules |
| Notifications | Not implemented | Email, SMS, Slack/Teams, reminders, borrower nudges |
| Multi-tenancy | Not implemented | Organization isolation, branch/team boundaries, tenant-aware authorization |
| Workflow customization | Fixed stage machine | Configurable stages, parallel approvals, exception handling, SLA policies |
| Testing depth | Smoke-level checks | Unit tests, route tests, browser tests, property tests, CI gates |
| Operations | Placeholder only | Deployment, observability, backups, migrations strategy, incident runbooks |
| Accessibility audit | Not completed as a formal pass | Keyboard/a11y review, screen reader checks, contrast audit |
| Performance/load | Not tested | Query tuning, load testing, concurrent-write strategy |

AI-DLC's **Reverse Engineering** stage was skipped because this was greenfield.
AI-DLC **Operations** was left as a placeholder because deployment and production
operations were intentionally out of scope.

## TODO

- Replace mock auth with a real identity provider and server-side session model.
- Add CSRF protection, rate limiting, secure cookie settings, and security tests.
- Implement real file uploads with storage, malware scanning, document preview, and
  deletion/retention controls.
- Add notification workflows for due documents, task assignments, stage changes, and
  borrower comments.
- Add route-level and browser-level tests for the major workflows.
- Add CI for install, lint/type-check, build, seed, and smoke tests.
- Add database migration tooling instead of auto-running schema setup from code.
- Add tenant/org isolation and a stricter authorization model.
- Add configurable lending workflows for different loan products.
- Add operational docs for deployment, backups, monitoring, and recovery.
- Run a formal accessibility and security review.
- Decide which AI-DLC extensions should be enabled next: deeper security baseline,
  property-based testing, resiliency, and operations.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build and type-check |
| `npm start` | Serve a production build |
| `npm run seed` | Seed demo data |
| `npm run db:reset` | Delete the DB and reseed |
| `npm run smoke` | Run the data-layer smoke test |
| `npm run lint` | Run Next lint command |

## Reference Status

This repo is useful as:

- a small example of AI-DLC artifacts living with source code;
- a runnable Next.js/SQLite prototype for a lending coordination workflow;
- a starting point for discussing what a production-grade version would require.

It is not suitable as:

- a secure production banking system;
- a real loan origination platform;
- a compliance-ready audit system;
- a document management system;
- a deployment-ready SaaS template.
