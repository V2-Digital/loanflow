## AI-DLC Lifecycle Diagram

`aidlc-docs/ai-dlc-lifecycle.html` is a self-contained reference diagram of the AI-Driven Development Life Cycle (AI-DLC) used to build LoanFlow.

It shows:

- **Business participation** — Product Owner/Sponsor, Domain Expert (SME), and Approver/Reviewer, with the lifecycle steps they engage and their AI-assistance level (L1–L2; business always retains the decision).
- **Entry · Reverse Engineering** — mapping an existing codebase into requirements & design. LoanFlow was originally greenfield, and now includes the repeatable feature traceability loop used when an existing app must be reverse engineered into user stories, tests, fixes, and retests.
- **Phase 1 · Inception** — Workspace Detection → Requirements Analysis → Workflow Planning → Application Design → Units of Work.
- **Phase 2 · Construction** — building against the units of work, then Build & Test.
- **Phase 3 · Operations** — Deployment/Dark Launches → Runbook → Observability → Backups → Post-mortems & Insights, with a feedback loop back into Inception for the next cycle.
- **AI-DLC Audit Logging** — runs across every step.

Each step is tagged with its AI-assistance level (L1 · AI-Assisted, L2 · AI-Augmented, L3 · Agentic) and the persona who leads it, defined by the skills and activity that level demands (e.g. Engineer, Solution Designer, Agent Orchestrator, SRE).

A side panel maps each phase to its actual folder/file structure under `aidlc-docs/` (reverse-engineering/feature-traceability-loop.md, requirements.md, workflow-plan.md, application-design.md, units-of-work.md, build-and-test-summary.md, aidlc-state.md, audit.md), plus the not-yet-built `operations/` folder, named for what it would contain.

Open the HTML file directly in a browser to view — no build step or server required.
