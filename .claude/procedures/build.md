# Build procedure

Run by the `builder-*` subagents that `/build` delegates to (issue #40). Follow docs/WORKFLOW.md and CLAUDE.md.
You are a subagent and cannot ask questions mid-run. Use the `code-search` subagent to locate code and run checks through the `test-runner` subagent so only failures come back. Use `gh` for GitHub; when `gh` is missing (some cloud sessions), use the GitHub MCP tools.

1. Require `status:ready` (or `status:changes-requested`). Read the issue and its plan comment (the plan lives only on the issue); read only the files the plan names and the matching row of `docs/CONTEXT_MAP.md`.
2. Set `status:in-progress` and move the card: `scripts/gh-project.sh status <issue-url> "In progress"`. Branch from main: `feat|fix|chore/<N>-<slug>` (in a cloud session, use the branch the session gives you).
3. Implement in small conventional commits referencing #N. Write tests first for bugs.
   **Work in checkpoints (issue #73).** A run is cut off after 50 turns and keeps nothing that was not pushed. After each group of changes (a few components, one endpoint, one module) commit, `git push -u origin <branch>`, and keep one short progress comment on the issue ("Done: …; remaining: …"). Open the PR as a draft after the first push when more than one group remains; make it ready at the end. If you are at about 40 turns and not done: stop, push, update the progress comment with what remains, set `status:blocked`, and end your summary with `BLOCKED: too big for one run, split it`.
   As soon as an acceptance criterion is met **and verified**, tick it: `scripts/gh-ac.sh check N <n…>` (`scripts/gh-ac.sh list N` shows the numbers; `uncheck` if it regresses).
4. Run `pnpm lint && pnpm typecheck && pnpm test` (and `pnpm test:e2e` when UI flows change) through `test-runner`. Fix until green.
   - If the same problem fails twice: stop, comment the problem on the issue (what fails, what you tried, the error), set `status:blocked`, push the branch as it is, and end your summary with `BLOCKED: <one line>`. Never switch model yourself; in a session with Merna the main session suggests escalating the `build:*` label.
5. Docs in the same branch (Definition of Done, docs/WORKFLOW.md §5):
   - SRS, the decision file `docs/decisions/<issue>-<slug>.md` (only if the issue makes a decision; never edit `docs/DECISIONS.md`, it is closed), CLAUDE.md status only if the milestone, next step or an open decision changed, `docs/plans/<N>-<slug>.md`: a copy of the approved plan comment, plus a "Deviations" section when you changed anything from it ("None" otherwise). Write it in this PR; planners do not.
   - Manual test cases file from `docs/test-cases/_TEMPLATE.md`; run `scripts/test-case-index.sh`.
   - Handbook (every PR): add the glossary entry, tech card (`docs/handbook/tech/_TEMPLATE.md`, `packages:` front matter) or pattern page for each new library, pattern or term; add a row at the top of `docs/handbook/learning-log.md`; fill the PR's "Concepts introduced" section (or write "None"). `pnpm docs:check` (part of `pnpm quality`) fails when a dependency has no card or a relative link is broken.
   - Backend: `pnpm api:openapi && pnpm api:postman`, `pnpm api:test` green on local, seed data + seed-data.md, tutorial updates.
6. Run `scripts/gh-ac.sh progress N`; it should be N/N. Any unticked criterion needs a reason in the PR body.
   Push and open the PR from the template with `Closes #N`, SRS IDs, the "Concepts introduced" section, the `progress` line, test summary, screenshots for visual changes, and the preview URL once Vercel posts it:
   - append the collapsed "Agent usage" block when `.agent-usage.json` exists (written by the Stop hook; skip silently when it does not): `node scripts/agent-usage.mjs block`
   - same labels as the issue (except status) and the **same milestone**: `gh pr create … --milestone "$(gh issue view N --json milestone --jq .milestone.title)"`
   - add the PR to the board and move the issue card: `scripts/gh-project.sh add <pr-url> "In review"` and `scripts/gh-project.sh status <issue-url> "In review"`.

   Then run `node scripts/ci-wait.mjs <pr-number>`. Exit 0 means CI is green. On exit 1, fix the reported cause, push and wait again; never skip a test, loosen a threshold or add a wall-clock assertion under 100 ms to make CI pass. Allow at most 3 wait/fix rounds. After the third red result, or on exit 2 (timeout), comment the failure on the issue, set `status:blocked`, push the branch and end the summary with `BLOCKED: <one line>`. The final summary must say `CI green`, or why CI could not become green.

7. Set `status:in-review` on the issue. Return a summary for Merna in Arabic (max 5 lines): PR link, preview link, what to check.
