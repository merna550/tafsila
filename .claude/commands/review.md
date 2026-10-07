---
description: Self-review the current branch against the Definition of Done before asking Merna
---

Check the diff of the current branch against main and docs/WORKFLOW.md §5 (Definition of Done).
Run `scripts/gh-ac.sh list <issue>`: the review **fails** if any acceptance criterion is unticked and the PR body gives no reason for it.
Report a checklist (pass/fail per item), fix every failing item you can, re-run checks, then summarise remaining risks in 3 lines.
Also check docs/CODING_STANDARDS.md: duplicated logic that should be extracted (search for similar code before accepting new helpers), code placed in the right package/layer, every function/component/type has a JSDoc purpose comment that matches what it does, names carry units, no magic numbers; run `pnpm quality`.
Also check: no secrets committed, env vars added to packages/config/env.ts and .env.example, migrations reversible, RTL layout respected, Arabic strings present for new UI text.
