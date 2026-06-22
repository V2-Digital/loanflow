# Workflow Plan — LoanFlow

## Stages selected

| Stage | Decision | Why |
|-------|----------|-----|
| Workspace Detection | Run | Mandatory; greenfield confirmed |
| Reverse Engineering | Skip | No existing code |
| Requirements Analysis | Run (standard) | Multi-persona, user-facing features |
| User Stories | Folded into requirements | Captured as acceptance criteria |
| Workflow Planning | Run | This document |
| Application Design | Run | New data model + components |
| Units Generation | Run | System decomposes into clear units |
| Functional Design | Folded into application design | Model + rules captured there |
| NFR Requirements/Design | Light | Captured as NFRs; mock-auth constraint |
| Infrastructure Design | Skip | Local single-node, no cloud resources |
| Code Generation | Run | Per unit |
| Build and Test | Run | Build + smoke test instructions |
| Operations | Skip | Placeholder phase |

## Execution sequence (text diagram)

```
Requirements
   |
   v
Application Design  ->  Units of Work (4)
                              |
        +---------------------+----------------------+----------------+
        v                     v                      v                v
  U1 Auth/Session   U2 Loan Pipeline   U3 Documents & Tasks   U4 Collaboration
        \___________________ build on shared data layer ______________/
                              |
                              v
                       Build and Test
```

## Build order

1. **U1 — Auth & Session** (foundation: users, mock session, role switcher).
2. **U2 — Loan Pipeline** (loans, stages, transitions, decision).
3. **U3 — Documents & Tasks** (requests, statuses, assignments).
4. **U4 — Collaboration** (assignments, comments, activity feed, dashboards).

Each unit shares the same SQLite data layer; later units extend earlier schema.
