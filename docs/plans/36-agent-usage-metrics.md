# Plan 36: agent usage metrics and weekly report

- `scripts/agent-usage.mjs`: parse execution file / transcript, build a numbers-only record, summary line, PR block, git-plumbing append to the `metrics` branch with retry.
- `scripts/agent-report.mjs`: pure weekly report (totals, trend, medians, top 3, flags, suggestions).
- `claude.yml` step "Record agent usage" (never fails the job); `agent-report.yml` on Sundays; Stop hook writes `.agent-usage.json`; `/build` adds the PR block.
- Docs: tutorial, glossary (turn, prompt cache, API-equivalent cost), Claude Code card, WORKFLOW section 2, ADR-027, SRS NFR-13, test cases.
- Tests: `scripts/agent-usage.test.mjs`, `scripts/agent-report.test.mjs`, `scripts/workflows.test.mjs`.
- Not verifiable offline: real action output field names and a live report run (acceptance criteria 1 and 4 need the first real runs).
