# ADR-180 · 2026-10-18 · Learning log: one file per issue, generated index

**Context:** Every PR added a row at the top of `docs/handbook/learning-log.md`; about seven merge conflicts in two days (follow-up to the "still conflict-prone" note in ADR-76). The old table also held 52 accidentally duplicated rows from earlier merges.
**Decision:** Each issue adds `docs/handbook/learning-log/<issue>-<slug>.md` (front matter `date`, `issue`, `title`; concept text; a `Read:` line; links relative to that folder). `pnpm learning-log:index` generates `learning-log.md` (newest first, then by file name) and `pnpm docs:check` fails when it is stale. `.gitattributes` marks the generated file `merge=ours`. The migration kept the 62 distinct old rows and dropped the duplicates; same-day order may differ.
**Alternatives:** keep one table and resolve by hand (the cause); `merge=union` (GitHub ignores it).
**Note:** GitHub's web merge ignores custom merge drivers, so the real protection is that PRs add different files; a stale index is caught by CI and fixed by one command.
