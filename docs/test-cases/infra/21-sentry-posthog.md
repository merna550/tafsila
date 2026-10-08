# Test cases — Sentry and PostHog

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #21                        |
| SRS          | NFR-09, NFR-05             |
| Area         | infra                      |
| Last updated | 2026-10-08 (by PR for #21) |

## Test data

No seeded records are needed. Staging URL: the `STAGING_URL` variable.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                                              | Priority | Preconditions                 | Steps                                                      | Expected result                                                                                | Automated by                                        | dev | staging |
| ------------ | -------------------------------------------------- | -------- | ----------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------- | --- | ------- |
| TC-OBS-21-01 | Test error on staging reaches Sentry               | High     | Staging deployed from main    | 1. Open `$STAGING_URL/api/debug/error` 2. Search Sentry    | 500 with `x-request-id`; event has release = merged SHA, environment staging, tag `request_id` | `packages/api/src/observability.test.ts` (API part) | ⬜  | ⬜      |
| TC-OBS-21-02 | `app_opened` reaches PostHog                       | High     | Staging deployed              | 1. Open `$STAGING_URL` 2. Check PostHog Live events        | One `app_opened` event, no cookie or localStorage entry created by PostHog                     | `apps/web/src/shared/analytics/analytics.test.ts`   | ⬜  | ⬜      |
| TC-OBS-21-03 | Debug route unavailable in production              | High     | App with `APP_ENV=production` | 1. GET `/api/debug/error`                                  | 404 standard body                                                                              | `packages/api/src/observability.test.ts`            | ⬜  | ⬜      |
| TC-OBS-21-04 | Debug route is throttled                           | Medium   | Staging                       | 1. Call the route twice within a minute                    | First 500, second 429                                                                          | `packages/api/src/observability.test.ts`            | ⬜  | ⬜      |
| TC-OBS-21-05 | Events cannot carry personal data                  | High     | none                          | 1. Run the schema tests                                    | `measurements`, `bust`, `waist`, `phone`, `email`, `photo` and email/phone values are rejected | `packages/schemas/src/analytics-events.test.ts`     | ⬜  | ⬜      |
| TC-OBS-21-06 | Sentry events contain no personal data             | High     | Staging error in Sentry       | 1. Open the event                                          | No email, phone, IP, cookies or request body; user is only an id                               | `packages/utils/src/scrub-event.test.ts`            | ⬜  | ⬜      |
| TC-OBS-21-07 | App starts without DSN or key                      | High     | No observability variables    | 1. `pnpm dev` 2. Open the home page                        | Page renders, no errors, nothing is sent                                                       | `apps/web/src/shared/analytics/analytics.test.ts`   | ⬜  | ⬜      |
| TC-OBS-21-08 | Direct PostHog import fails the architecture check | Medium   | none                          | 1. Import `posthog-js` in another file 2. `pnpm depcruise` | Rule `analytics-via-wrapper` fails                                                             | manual only                                         | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
