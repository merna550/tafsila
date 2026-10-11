---
description: Prepare a production release checklist from staging
---

1. List merged PRs since the last production release (`gh release view`, `git log`), grouped by area.
2. Confirm CI, e2e and `pnpm api:test` (Newman against staging) are green; paste results.
3. Run `bash scripts/test-case-index.sh` (the index is generated, not committed), then from `docs/test-cases/index.md` list every High-priority case touched by these PRs that is manual-only or not yet ✅ on staging, as a checklist Merna can follow in order, with the seed account to use.
4. Check pending migrations are backward compatible and env vars exist in the production environment.
5. Reply in Arabic: checklist link/file, risks (max 3 lines), and "ready to click Deploy to production" or what blocks it.
