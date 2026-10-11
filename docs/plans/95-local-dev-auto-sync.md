# Plan #95 · Local dev: auto-install dependencies and load root .env.local

Scripts: `scripts/check-deps.mjs` (+ test), `scripts/sync-deps.sh`; root `predev`; `apps/web/next.config.ts` loads the root env; husky hooks call `sync-deps.sh`. Decision: [ADR-95](../decisions/95-local-dev-auto-sync.md).
