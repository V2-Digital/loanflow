# AWS AI-DLC Workflows v2 vs LoanFlow AI-DLC

This artifact compares the upstream AWS Labs AI-DLC Workflows v2 implementation with
the AI-DLC lifecycle adapted in this LoanFlow repository.

## Sources

- AWS Labs AI-DLC Workflows v2 branch: [awslabs/aidlc-workflows/tree/v2](https://github.com/awslabs/aidlc-workflows/tree/v2)
- AWS v2 phases and stages guide: [docs/guide/04-phases-and-stages.md](https://github.com/awslabs/aidlc-workflows/blob/v2/docs/guide/04-phases-and-stages.md)
- AWS v2 scopes, depth, and test strategy guide: [docs/guide/05-scopes-and-depth.md](https://github.com/awslabs/aidlc-workflows/blob/v2/docs/guide/05-scopes-and-depth.md)
- AWS v2 agents guide: [docs/guide/06-agents.md](https://github.com/awslabs/aidlc-workflows/blob/v2/docs/guide/06-agents.md)
- AWS v2 state and audit guide: [docs/guide/10-state-and-audit.md](https://github.com/awslabs/aidlc-workflows/blob/v2/docs/guide/10-state-and-audit.md)
- LoanFlow local artifacts: `aidlc-docs/`, `feature-status-tracker.csv`, and `scripts/user-story-checks.ts`

## Executive Summary

AWS AI-DLC Workflows v2 is a portable methodology runtime. It packages the AI-DLC
method into harness-specific distributions, agents, hooks, tools, sensors, scopes,
state, audit, and verification gates.

LoanFlow uses AI-DLC as an application-bound evidence trail. It keeps the lifecycle
visible in the app, documents the actual build decisions under `aidlc-docs/`, and
adds a reverse-engineering loop that turns code into a canonical user-story
traceability matrix.

## Side-by-Side Comparison

| Dimension | AWS Labs AI-DLC Workflows v2 | LoanFlow version used in this repo |
|---|---|---|
| Primary purpose | Reusable AI-DLC framework that can run complete software delivery workflows across multiple agent harnesses. | Concrete reference application plus checked-in AI-DLC evidence for how LoanFlow was built and reverse engineered. |
| Delivery shape | Methodology-as-runtime: one harness-neutral `core/` emitted into Claude Code, Codex CLI, Kiro IDE, and Kiro CLI distributions. | Methodology-as-repo-artifacts: Markdown, HTML diagrams, tracker CSV, and story checks surfaced inside a Next.js app. |
| Lifecycle phases | 5 phases: Initialization, Ideation, Inception, Construction, Operation. | Entry/Reverse Engineering plus Inception, Construction, and placeholder Operations; the visual also shows business participation and feedback. |
| Stage count | 32 stages with explicit stage definitions, gates, and conditional execution. | Smaller practical subset: workspace detection, requirements, workflow planning, application design, units of work, build/test, plus reverse-engineering traceability. |
| Reverse engineering | Stage 2.1 for brownfield projects, with developer code scan and architect synthesis. | First-class repeatable loop: inventory every feature, synthesize user stories, update `feature-status-tracker.csv`, test, fix UX/logistical errors, and retest. |
| Scope model | 9 scopes: enterprise, feature, mvp, poc, bugfix, refactor, infra, security-patch, workshop. Scope controls which stages run. | No runtime scope engine. Scope is documented as a greenfield reference app with a later reverse-engineering loop and selected extensions. |
| Depth and test strategy | Separate Minimal, Standard, and Comprehensive depth levels, plus independent test strategy levels. | Depth is manually chosen by project intent. Testing is concrete and app-specific through smoke checks and `scripts/user-story-checks.ts`. |
| Agent model | 11 named domain agents: product, design, delivery, architect, AWS platform, compliance, devsecops, developer, quality, pipeline-deploy, operations. | Persona levels are shown visually: Engineer, Solution Designer, Agent Orchestrator, SRE, plus business participants. No installed agent roster. |
| Autonomy and gates | Approval gates at stages and phase boundaries; construction supports walking-skeleton gate, ladder prompt, autonomous or gated bolts. | Human-directed Codex work with explicit user requests; artifacts and tracker rows document decisions after implementation. |
| State tracking | Intent-specific `aidlc-state.md` with six-state checkboxes and resume metadata under `aidlc/spaces/<space>/intents/...`. | Single repo-level `aidlc-docs/aidlc-state.md` summarizing project progress and decisions. |
| Audit model | Append-only per-clone audit shards with a 68-event taxonomy across workflow, stage, session, sensors, worktrees, learning, and swarm events. | Lightweight `aidlc-docs/audit.md` narrative log plus `feature-status-tracker.csv` test/fix/retest evidence. |
| Learning loop | Corrections become durable project/team rules; sensors can be proposed and installed through the workflow. | Learning is encoded manually as documentation, tracker rows, story checks, and updated app artifacts. |
| Sensors and validation | Framework sensors for required sections, upstream coverage, linting, and type checking, wired into hooks. | App validation uses Next build, scripted story checks, HTTP checks, browser checks, and CSV tracker coverage. |
| Operations | Full Operation phase with deployment pipeline, environment provisioning, deployment execution, observability, incident response, performance validation, feedback optimization. | Operations is represented in the lifecycle diagram as the target model, but actual implementation remains a placeholder/out of scope for this demo app. |
| Repository structure | Large framework repo: `core/`, `harness/`, `dist/`, `docs/`, `tests/`, tools, hooks, agents, sensors, and generated harness packages. | Product repo: `app/`, `components/`, `lib/`, `scripts/`, `aidlc-docs/`, `feature-status-tracker.csv`, and visual artifacts. |
| Best fit | Teams that want a reusable AI-DLC operating system across many projects and harnesses. | Demo and reference teams that want AI-DLC traceability embedded beside a working app. |

## What LoanFlow Kept

- The phase language of inception, construction, operations, and feedback.
- The idea that reverse engineering is a legitimate AI-DLC entry point.
- Traceability from requirements and user stories to implementation and test evidence.
- Human review checkpoints around higher-autonomy work.
- An audit trail that explains why artifacts exist.

## What LoanFlow Simplified

- No multi-harness installer or generated distribution.
- No formal 32-stage state machine.
- No runtime scope/depth/test strategy router.
- No Bedrock/Bun framework dependency.
- No installed agents, hooks, sensors, or per-intent audit shard system.

## What LoanFlow Added Locally

- `/aidlc` artifact browsing inside the product app.
- `/feature-tracker` as a rendered view of the canonical traceability matrix.
- A self-contained AI-DLC lifecycle presentation slug.
- Imported visual artifacts from the repository diagram bundle.
- A reverse-engineering loop phrased directly as the operator goal used in this project.

## Practical Interpretation

AWS v2 is the upstream framework shape. LoanFlow is a product-specific adaptation:
lighter, easier to inspect in a demo, and optimized for showing the lifecycle record
beside the working application. The tradeoff is deliberate. LoanFlow does not provide
the full AI-DLC runtime, but it does make the AI-DLC evidence, traceability, and
presentation artifacts easy to review inside the app.
