---
packages: ["@sentry/nextjs", "@sentry/node", posthog-js, posthog-node]
level: intermediate
adr: ADR-003
---

# Sentry and PostHog

**In one line:** Sentry tells us when and where the app breaks; PostHog tells us what users actually do and controls feature flags. Both wired in M0 (issue #21).

## What it is (plain words)

Sentry collects errors with stack traces and the steps before a crash. PostHog records product events (such as "pattern generated"), funnels, and feature flags that turn features on for some users.

## Why we chose it

- **We cannot watch users alone,** so crashes must reach us automatically (Sentry) and product questions must be answered with data (PostHog): where do users abandon the measurements form, how many patterns reach the print step.
- **Feature flags** let us release risky features to a few users first ([glossary: feature flag](../glossary.md#feature-flag)).
- **Region.** Our PostHog project is in the US region and a region cannot change; EU vs US is revisited with the privacy policy at M8 ([glossary: PDPL](../glossary.md#pdpl), ADR-025).
- **Free tiers.** Checked on 2026-10-07: Sentry's Developer plan is free for one user with about 5,000 errors per month ([sentry.io/pricing](https://sentry.io/pricing/)); PostHog's free tier includes 1 million events and 1 million feature-flag requests per month ([posthog.com/pricing](https://posthog.com/pricing)).
- **Wrapped, not scattered.** Analytics goes through one `shared/analytics` module in the web app and `Analytics` and `ErrorReporter` ports in the API ([ARCHITECTURE section 6](../../ARCHITECTURE.md)); dependency-cruiser enforces it.

## Alternatives we considered (and why not)

- **Datadog:** expensive for our stage.
- **Google Analytics:** weak product analytics and funnels, poorer privacy fit.

## When we would change it

When free-tier volumes are exceeded or the privacy review (M8) requires a different data location. Never put measurements or photos in analytics events.

## Where it lives in our code

- Event list: `packages/schemas/src/analytics-events.ts` (strict schemas, the single list). Config: `loadPublicConfig` in `packages/config/src/env.ts`.
- Web: `apps/web/src/shared/analytics/` (the only importer of `posthog-js`), `apps/web/src/shared/monitoring/`, `apps/web/src/shared/observability/ObservabilityProvider.tsx`, `apps/web/src/instrumentation.ts`, `apps/web/next.config.ts`.
- API: `packages/api/src/ports/error-reporter.ts` and `analytics.ts`, adapters in `packages/api/src/adapters/{sentry,posthog,noop}`, `middleware/request-id.ts`, `middleware/error-handler.ts`, `routes/debug.ts`.
- Scrubber: `packages/utils/src/scrub-event.ts`. Decision: ADR-025. Requirement: [SRS](../../SRS.md) NFR-09.

## Commands you'll use

`GET /api/debug/error` on staging or locally proves an error reaches Sentry (once a minute). Keys are the variables `SENTRY_DSN`, `POSTHOG_KEY`, `POSTHOG_HOST`; CI also needs `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` for source maps.

## Common mistakes

- Sending body measurements, names or phone numbers to analytics.
- Calling the PostHog SDK directly from feature code instead of the wrapper.

## Learn more

- [Sentry for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/), [PostHog docs](https://posthog.com/docs) (official)
- Glossary: [Sentry](../glossary.md#sentry), [PostHog](../glossary.md#posthog), [feature flag](../glossary.md#feature-flag)
