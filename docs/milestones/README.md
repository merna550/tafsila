# Milestone briefs

One page per active milestone: goal, scope, SRS IDs, deliverables, exit criteria, dependencies, Merna's tasks, risks and the issue list. Agents read the brief of the milestone they work in instead of re-deriving scope.

| Milestone                      | Brief                                                      |
| ------------------------------ | ---------------------------------------------------------- |
| M0 - Foundation & environments | [M0-foundation.md](M0-foundation.md)                       |
| M1 - Accounts & data           | [M1-accounts-and-data.md](M1-accounts-and-data.md)         |
| M2 - Engine core               | [M2-engine-core.md](M2-engine-core.md)                     |
| M3 - Design & pattern UI       | [M3-design-and-pattern-ui.md](M3-design-and-pattern-ui.md) |
| M4 - Outputs                   | [M4-outputs.md](M4-outputs.md)                             |
| M5 - Fabric                    | [M5-fabric.md](M5-fabric.md)                               |

Rules (issue #22, [ADR-024](../DECISIONS.md)):

- The next milestone's brief is written when the current one is about 70% done, with `/plan-milestone` (Opus, once per milestone).
- `/plan-milestone` splits a milestone into issues; `/plan-wave` plans the next wave of those issues. See [WORKFLOW section 8](../WORKFLOW.md#8-github-board-and-milestones).
- Decisions Merna already made are in [DECISIONS.md](../DECISIONS.md); do not ask them again.
