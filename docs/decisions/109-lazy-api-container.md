# ADR-109 · 2026-10-12 · The API container is built on the first request

**Context:** `vercel pull` writes Vercel "Sensitive" variables as the literal `[SENSITIVE]`. `route.ts` called `createApp()` at import, so `next build` (page data collection) crashed on `SUPABASE_URL`, `SENTRY_DSN` and `DATABASE_URL` values that only exist at runtime. The Docker image has the same risk (ADR-004: build once, configure at runtime).

**Decision:**

- `route.ts` uses `createLazyFetch(() => createApp())`: the app is built on the first request and reused; a failed build is retried. The route is `dynamic = "force-dynamic"`.
- Adapters that parse config do it on first use: `createJwksTokenVerifier` builds its `URL` on the first `verify`; `createWithUser` creates the Postgres client on the first call.
- A bad `SUPABASE_URL` throws `TokenVerifierConfigError`; `requireAuth` lets it through, so the standard 500 `INTERNAL_ERROR` body is returned (a bad token still gives 401).
- A `SENTRY_DSN` that is not a valid URL turns Sentry off (one warning in `instrumentation.ts`, silently in the container) instead of crashing.

**Reason:** a placeholder must fail one request with a clear error, never the build.

**Alternatives:** keep public values non-sensitive only (Merna's short-term workaround; leaves the risk for any other variable); read config with a build-phase check (`NEXT_PHASE`), which couples the API to Next.js.
