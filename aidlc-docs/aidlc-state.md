# AI-DLC State

**Project**: LoanFlow — Business Loan Coordination (bank reference implementation)
**Type**: Greenfield
**Methodology**: AI-DLC (AI-Driven Development Life Cycle)

## Intent

Build a Next.js reference application for a bank where a team coordinates a business
loan. Combines a stage-based approval pipeline with document collection, task
tracking, team assignment, and activity/comment threads. Personas span the internal
bank team and the borrower. Persistence via SQLite; mock role-based auth.

## Stage Progress

| Phase | Stage | Status | Notes |
|-------|-------|--------|-------|
| Inception | Workspace Detection | ✅ Done | Greenfield, empty workspace |
| Inception | Reverse Engineering | ⏭️ Skipped | Greenfield |
| Inception | Requirements Analysis | ✅ Done | Standard depth (see requirements/) |
| Inception | User Stories | ✅ Done (folded into requirements) | Personas + stories captured |
| Inception | Workflow Planning | ✅ Done | plans/workflow-plan.md |
| Inception | Application Design | ✅ Done | application-design/ |
| Inception | Units Generation | ✅ Done | 4 units (see units/) |
| Construction | Code Generation | ✅ Done | All units implemented |
| Construction | Build and Test | ✅ Done | build-and-test/ |
| Operations | — | ⏭️ Placeholder | Out of scope |

## Extension Configuration

| Extension | Enabled | Rationale |
|-----------|---------|-----------|
| security/baseline | Partial (directional) | Auth is mock-only by design; input validation + parameterized SQL applied. Not production-hardened. |
| testing/property-based | Disabled | Reference scope; example-based smoke tests instead. |
| resiliency/baseline | Disabled | Single-node local reference. |

## Key Decisions

- Full runnable app (Next.js App Router + TypeScript).
- Workflow models BOTH a pipeline and document/task coordination.
- Personas: loan officer, underwriter, credit analyst, manager, borrower.
- SQLite (better-sqlite3) + cookie-based mock session with role switcher.
- Reference/educational use only — not production-secure.
