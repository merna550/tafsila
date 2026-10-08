# Plan #22: milestone briefs, planning commands, M0-M1 decisions

Issue: #22 · plan:none · build:sonnet · Milestone: M0 - Foundation & environments

The issue body and Merna's decisions comment are the plan.

1. **Decisions** recorded in ADR-024 and SRS (FR-AUTH-02, FR-MEAS-01, FR-MEAS-06, §12, §13): name kept, domain to M8, sizes S-XXL, OTP channel at M8, ease to M3, mini admin stays in M1.
2. **Briefs:** `docs/milestones/` with a README, `M0-foundation.md`, `M1-accounts-and-data.md`; every M0/M1 issue is listed.
3. **Commands:** `.claude/commands/plan-milestone.md` (brief + draft issues) and `plan-wave.md` (plan the next wave, Merna approves in one reply).
4. **Docs:** WORKFLOW (lifecycle table and section 8, 70% rule), CLAUDE.md (commands, map, status), glossary entry, learning log, seed-data size range, manual test cases.

Verification: `pnpm quality && pnpm test`; every `#N` in the briefs exists on GitHub.
