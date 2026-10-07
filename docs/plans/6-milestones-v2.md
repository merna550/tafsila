# Plan #6: MVP milestone plan v2 + acceptance-criteria ticking

Issue: #6 · plan:none · build:sonnet · Milestone: M0 - Foundation & environments

The issue body is the plan (`plan:none`). Summary of what was done:

1. **SRS:**
   - §12 now lists M0–M9 + Post-launch with exit criteria, without week estimates.
   - 3D moved to out-of-scope (post-launch) in §1.2.
   - §4.13 has a post-launch note, and FR-3D-01…03 changed from M to S.
2. **WORKFLOW:**
   - §8 milestone map now uses the GitHub titles exactly.
   - §5 Definition of Done has the criteria-ticking rule.
   - §8 documents `scripts/gh-ac.sh`.
3. **Commands:**
   - `triage`: example milestone is now `M2 - Engine core`.
   - `build`: tick each verified criterion; put the `progress` line in the PR.
   - `review`: fails on unticked criteria with no reason.
   - `ship`: requires N/N before merge.
   - `status`: shows `x/y criteria` and the per-milestone open/closed count.
4. **Script:** `scripts/gh-ac.sh` (list / check / uncheck / progress), now executable.
5. **Other docs:** ADR-009, `CLAUDE.md` status, and the old milestone title in `docs/plans/3-agent-config.md`.
6. **Open issues:** only #6 is open, and it already has M0. Nothing to move.

## Verification

- `grep -rnE "M[0-9] - " --include='*.md' .` (excluding `node_modules`) shows only the new titles.
- WORKFLOW §8 titles equal `gh api repos/{owner}/{repo}/milestones`.
- `pnpm quality && pnpm test` green.
