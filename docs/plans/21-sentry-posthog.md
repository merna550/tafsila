## Plan #21: Sentry errors + PostHog analytics wired in web and API

plan:sonnet · build:sonnet · size:M · Depends on #19 (merged, PR #54). Save this plan as `docs/plans/21-sentry-posthog.md` with the build.

### Context

M0 exit criterion 3 / NFR-09: errors and product events from staging must be visible. Today nothing reports anywhere: `handleError` only does `console.error`, there is **no request-id middleware** (the issue assumes one; ARCHITECTURE §3 lists it but it was never built), `apps/web/src` has no `shared/` folder, and there is no `Analytics` port. Release and environment already exist in `loadBuildInfo()` (`packages/config/src/env.ts`: `environment`, `version`, `gitSha`). The free-tier rule (ADR-022) applies: Sentry Developer plan, PostHog Free with billing limit $0, no payment method. Merna has already created both accounts and added the variables (Vercel: `SENTRY_DSN`, `POSTHOG_KEY`, `POSTHOG_HOST`; GitHub: secret `SENTRY_AUTH_TOKEN`, variables `SENTRY_ORG`, `SENTRY_PROJECT`). Her PostHog project is in the **US** region.

### Decisions (new ADR-025 at build time)

1. **Browser config is read at runtime, not build time.** `NEXT_PUBLIC_*` is inlined at build, which breaks "build once, run anywhere" (Dockerfile header, ADR-004). The root layout (server component) calls a new `loadPublicConfig()` from `packages/config` and passes `{ sentryDsn, posthogKey, posthogHost, appEnv, release }` as props to one client component. The Sentry DSN and PostHog project key are public by design.
2. **API errors reach Sentry through a port.** Hono's `onError` swallows errors, so Next's `onRequestError` never sees them. New `ErrorReporter` port (`packages/api/src/ports/error-reporter.ts`), Sentry adapter, no-op adapter when no DSN. Wired in `container.ts`; `handleError` calls it with the request id. Services never import Sentry (existing `services-use-ports-not-adapters` rule).
3. **Request id:** new `middleware/request-id.ts` (reuse a safe inbound `x-request-id`, else `crypto.randomUUID()`), stored on the Hono context, returned in the `x-request-id` response header, added to the 500 log line and to the standard error body as an additive field `request_id` (so a user can read it out to support).
4. **Privacy defaults (NFR-05):** PostHog `persistence: "memory"` (no cookie, no localStorage until the M8 consent work), `autocapture: false`, `disable_session_recording: true`, `person_profiles: "identified_only"`. Sentry: `sendDefaultPii: false`, a `beforeSend` scrubber that strips `user.email`, `user.phone`, `user.ip_address` and request bodies/cookies. User context is the opaque user id only; `ErrorReporter.setUser(id)` exists now and is called by the M1 auth middleware (no auth yet, so nothing sets it in this issue).
5. **Debug route** `GET /api/debug/error`: registered only when `appEnv !== "production"` (404 in production, tested), throws a unique error and is throttled to one report per minute per instance (429 otherwise), so a public staging URL cannot burn the 5,000 errors/month free quota.
6. **Source maps** are uploaded by the staging CI build only (`SENTRY_AUTH_TOKEN` never goes to Vercel). Vercel's own preview builds skip the upload (no token), so preview stacks are minified; acceptable for M0.
7. **Observability is required in production:** `SENTRY_DSN` and `POSTHOG_KEY` join `PRODUCTION_REQUIRED_KEYS` (optional everywhere else, so local/CI/preview start without them).
8. **PostHog region:** the project is US (`POSTHOG_HOST` default `https://us.i.posthog.com`); a project's region cannot change. EU vs US is revisited with the M8 privacy policy; record it in ADR-025.

### Changes

**Config**: `packages/config/src/env.ts`

- Add optional `SENTRY_DSN` (url), `POSTHOG_KEY`, `POSTHOG_HOST` (default `https://us.i.posthog.com`); extend `PRODUCTION_REQUIRED_KEYS`.
- New `loadPublicConfig(source)` returning only the browser-safe subset plus `appEnv` and `release` (= `gitSha`). Tests extend `env.test.ts`.

**API** (`packages/api/src`)

- `middleware/request-id.ts`; mounted first in `app.ts`. Context typing via Hono `Variables`.
- `ports/error-reporter.ts` (`captureException(error, { requestId })`, `setUser(id)`), `adapters/sentry/sentry-error-reporter.ts` (`@sentry/node`, same version as the one `@sentry/nextjs` depends on, so there is one module instance), `adapters/noop/noop-error-reporter.ts`.
- `ports/analytics.ts` (`capture(event, properties)`), `adapters/posthog/posthog-analytics.ts` (`posthog-node`), no-op adapter. Typed event names shared with the web through `packages/schemas` (`analytics-events.ts`, zod), the single event list.
- `container.ts`: add `errorReporter`, `analytics`; choose real or no-op from the config keys.
- `middleware/error-handler.ts`: report non-`AppError` errors, log one JSON line `{level, request_id, message}`, include `request_id` in the body.
- `routes/debug.ts` mounted only for non-production environments.

**Web** (`apps/web`)

- `src/shared/analytics/`: `analytics.ts` (wrapper: `track`, `useFeatureFlag`, the only importer of `posthog-js`), `AnalyticsProvider.tsx` (client component, initialises PostHog from the runtime props, fires `app_opened` once), `index.ts`. Feature flag `signups_open` read through `useFeatureFlag` (not used to gate anything until M1).
- `src/shared/monitoring/`: client Sentry init from the same props.
- `src/instrumentation.ts`: keep `loadServerEnv()`, add Sentry server init and `export const onRequestError`.
- `src/app/layout.tsx`: mount the provider with `loadPublicConfig()`.
- `next.config.ts`: `withSentryConfig` (silent, no upload without a token, delete maps after upload).
- `src/app/page.tsx`: the "ابدئي الآن" button becomes a tiny client component that fires `signup_started` (placeholder until the M1 signup form).
- `package.json`: `@sentry/nextjs`, `posthog-js`; `packages/api`: `@sentry/node`, `posthog-node`. Check that the chosen `@sentry/nextjs` supports Next 16 before pinning.

**Architecture rules**: `.dependency-cruiser.cjs`

- `analytics-via-wrapper`: `posthog-js` only from `apps/web/src/shared/analytics`; `posthog-node` only from `packages/api/src/adapters/posthog`.
- `sentry-via-wrappers`: `@sentry/*` only from `apps/web/src/shared/monitoring`, `apps/web/src/instrumentation.ts`, `apps/web/next.config.ts` and `packages/api/src/adapters/sentry`.

**CI**: `.github/workflows/staging.yml` (deploy job): `SENTRY_AUTH_TOKEN` (secret), `SENTRY_ORG`, `SENTRY_PROJECT` (variables) and `SENTRY_RELEASE: ${{ github.sha }}` as `env:` of the build step only.

**Docs**

- `docs/DECISIONS.md` ADR-025; `docs/plans/21-sentry-posthog.md` (this plan); CLAUDE.md status; M0 brief row.
- `docs/handbook/tech/sentry-posthog.md`: installed now, `packages:` includes `@sentry/nextjs`, `@sentry/node`, `posthog-js`, `posthog-node` (needed by `docs:check`); glossary: request id, release, source map, feature flag.
- New handbook page `docs/handbook/find-a-bug-from-a-report.md` (Sentry → request id → logs → code), linked from `START_HERE.md` and `troubleshooting.md`; cookie/consent note for M8 in it and in the M8 brief.
- `docs/backend/tutorials/switch-environment.md`, `.env.example`: new variables per environment (names only).
- Test cases `docs/test-cases/observability/TC-OBS-21-xx` (error on staging, `app_opened`, debug route 404 in production, privacy check) + `scripts/test-case-index.sh`; learning-log row; PR "Concepts introduced".

### Merna does (already done)

Sentry and PostHog accounts (no card), Vercel variables (`SENTRY_DSN`, `POSTHOG_KEY`, `POSTHOG_HOST` for Production and Preview), GitHub secret `SENTRY_AUTH_TOKEN` and variables `SENTRY_ORG`, `SENTRY_PROJECT`. If the build needs another name, it adds `needs:decision` and asks once.

### Tests

- API: request-id (generate, reuse safe inbound, reject over-long or non-printable inbound); error handler returns `request_id` and calls the reporter once with it; debug route throws on staging, is 404 in production, 429 on the second call within a minute; container picks the no-op reporter without a DSN.
- Config: new keys optional locally, required when `APP_ENV=production`; `loadPublicConfig` never returns secrets.
- Privacy: the zod event schemas are `.strict()`; a test feeds `measurements`, `bust`, `waist`, `phone`, `email`, `photo` keys and email/phone-shaped values and expects rejection; Sentry `beforeSend` scrubber test.
- Web: analytics wrapper is a no-op without a key and never throws; `app_opened` fires once.
- `pnpm depcruise` is green; a temporary direct `posthog-js` import in another file makes it fail (checked locally, not committed).

### Verification (end to end)

1. `pnpm quality && pnpm test` green; app starts locally with no DSN/key.
2. Open the PR → preview works, `/api/debug/error` returns 500 with `x-request-id`.
3. After merge and the staging workflow: call `$STAGING_URL/api/debug/error` → the event appears in Sentry with `release` = the merged SHA, `environment=staging`, tag `request_id` equal to the response header, readable stack (source maps).
4. Open `$STAGING_URL` → `app_opened` appears in PostHog Live events.
5. `GET /api/debug/error` on a production-config run → 404.
6. Tick the six acceptance criteria only as each is seen.

### Risks

- Two Sentry module instances (`@sentry/nextjs` vs `@sentry/node`) would split the scope → pin one version; step 3 proves the API error carries the tags.
- Runtime browser config means Sentry/PostHog start after hydration, so very early errors are missed; acceptable.
- Free quotas (5,000 errors, 1M events): throttled debug route, `autocapture` off.
- Adding `request_id` to the error body is additive; OpenAPI/Postman error schema is updated if those scripts exist.
- Size stays M; build:sonnet fits (follows the port/adapter pattern). Touches ui, api and infra, so the build stops and comments if the Sentry/Next 16 version check fails.
