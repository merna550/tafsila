# ADR-95 · 2026-10-11 · Local dev syncs dependencies and reads the root env file

**Context:** After pulls, `pnpm dev` failed twice on missing dependencies and once because Next.js reads `.env.local` only from `apps/web/` while the documented file is at the repo root.

**Decision:**

- `predev` runs `scripts/check-deps.mjs`: compares `pnpm-lock.yaml` with `node_modules/.pnpm/lock.yaml`, installs when different, then validates the three Supabase keys (names only, never values). Skipped when `CI=true`.
- `apps/web/next.config.ts` loads the root `.env.local` with Node's `process.loadEnvFile` (no new dependency; it never overrides variables already set, so `apps/web/.env.local` still wins). Chosen over `@next/env` (extra dependency and handbook card) and over a bootstrap symlink (breaks on fresh clones and Windows).
- `scripts/sync-deps.sh` holds the git-hook logic (husky `post-merge`, `post-rewrite`, `post-checkout`).

**Reason:** one env file, no manual steps after a pull, nothing new to install.

**Alternatives:** `@next/env`; symlink in `scripts/bootstrap.sh`.
