# Reverse Engineering Feature Traceability Loop

**Phase**: Entry / Reverse Engineering.
**Automation level**: L3 Agentic with L1-L2 human review checkpoints.
**Primary artifacts**: `feature-status-tracker.csv`, user stories, test evidence, fix notes, retest notes.

## Purpose

This loop turns an existing app into a living AI-DLC traceability matrix. It reverse
engineers every observable feature from the codebase, writes a user story and expected
behavior for each feature, tracks verification status in one canonical spreadsheet,
then drives a test-fix-retest cycle until user-visible behavior is documented and
logistical or UX errors are resolved.

The loop is intentionally canonical: there is one feature tracker, not parallel notes.
For LoanFlow that tracker is `feature-status-tracker.csv`, surfaced in the app at
`/feature-tracker`.

## Operator Goal

```text
/goal go over every single feature in this app create a user story with expected behaviour based on the code keep a single canonical spreadsheet tracking the features status

when done switch loop to testing every user story and documenting all errors
when done fix every logistical error or ux error
test every user behaviour again post fix
```

## Loop Stages

| Stage | AI-DLC activity | Output | Human checkpoint |
|-------|-----------------|--------|------------------|
| 1. Inventory | Reverse engineer routes, components, API handlers, data model, scripts, and docs. | Feature list with stable IDs. | Confirm scope and exclusions. |
| 2. Story synthesis | Convert each feature into a user story with persona, preconditions, and expected behavior based on code. | Rows in `feature-status-tracker.csv`. | Review wording for business intent. |
| 3. Traceability mapping | Link each story to code evidence, UI/API paths, and test method. | Evidence source and path columns populated. | Confirm the tracker is the single source of truth. |
| 4. Story testing | Execute every user story through scripts, API checks, and browser behavior where relevant. | Test result plus error or UX issue notes. | Triage issues as defect, UX gap, or accepted behavior. |
| 5. Fix pass | Fix logistical errors, broken behavior, unclear flows, and UX issues found by the story tests. | Fix status and linked code changes. | Approve behavior changes. |
| 6. Retest pass | Re-run every affected user behavior after fixes. | Retest result and final status. | Accept or send back through the loop. |

## Canonical Traceability Matrix

The tracker must keep enough information to audit each feature from code discovery
through retest:

| Column | Meaning |
|--------|---------|
| ID | Stable feature/story identifier. |
| Area | Product area or lifecycle area. |
| Feature | Short feature name. |
| User story | Persona-centered statement of value. |
| Primary persona(s) | Users or operators affected. |
| Preconditions | Required data, auth state, runtime, or route state. |
| Expected behavior based on code | Behavior inferred from implementation, not wishful intent. |
| Evidence source | Files, functions, scripts, or docs proving the behavior. |
| UI/API path | Route, endpoint, command, or view where behavior appears. |
| Current status | Discovery/test/fix state. |
| Test method | Browser, API, script, command, or manual inspection. |
| Test result | What happened during verification. |
| Error or UX issue | Defect, friction, ambiguity, or accepted none-found note. |
| Fix status | Required, in progress, fixed, or not required. |
| Retest result | Post-fix verification result. |

## Operating Rules

- Every feature gets exactly one canonical row unless a feature genuinely splits into
  independent user behaviors.
- Expected behavior is based on the current code, with product gaps logged separately
  as errors, UX issues, or future requirements.
- The loop starts in reverse engineering, but it does not stop at documentation; it
  hands off to construction fixes and returns through testing until retest is clean.
- The matrix is updated as the work happens. It is not reconstructed after the fact.
- Rows stay stable across fixes so the audit trail remains readable.

## LoanFlow Binding

LoanFlow already implements this pattern with:

- `feature-status-tracker.csv` as the canonical spreadsheet.
- `/feature-tracker` as the in-app reader for the tracker.
- `scripts/user-story-checks.ts` as the repeatable story verification harness.
- `aidlc-docs/audit.md` and this artifact as lifecycle evidence.

Future AI-DLC runs should start this loop whenever the input is an existing codebase,
an inherited prototype, or a demo that needs evidence-backed user stories before
further construction.
