---
packages: ["@sentry/nextjs", posthog-js, posthog-node]
level: intermediate
adr: ADR-003
---

# Sentry and PostHog

**In one line:** Sentry tells us when and where the app breaks; PostHog tells us what users actually do and controls feature flags. Both planned for M0 to M8.

## What it is (plain words)

Sentry collects errors with stack traces and the steps before a crash. PostHog records product events (such as "pattern generated"), funnels, and feature flags that turn features on for some users.

## Why we chose it

- **We cannot watch users alone,** so crashes must reach us automatically (Sentry) and product questions must be answered with data (PostHog): where do users abandon the measurements form, how many patterns reach the print step.
- **Feature flags** let us release risky features to a few users first ([glossary: feature flag](../glossary.md#feature-flag)).
- **EU hosting for PostHog** (an EU Cloud region exists), helpful for the privacy policy and trust ([glossary: PDPL](../glossary.md#pdpl)).
- **Free tiers.** Checked on 2026-10-07: Sentry's Developer plan is free for one user with about 5,000 errors per month ([sentry.io/pricing](https://sentry.io/pricing/)); PostHog's free tier includes 1 million events and 1 million feature-flag requests per month ([posthog.com/pricing](https://posthog.com/pricing)).
- **Wrapped, not scattered.** Analytics goes through one `shared/analytics` module and a `FeatureFlags` port ([ARCHITECTURE section 6](../../ARCHITECTURE.md)).

## Alternatives we considered (and why not)

- **Datadog:** expensive for our stage.
- **Google Analytics:** weak product analytics and funnels, poorer privacy fit.

## When we would change it

When free-tier volumes are exceeded or the privacy review (M8) requires a different data location. Never put measurements or photos in analytics events.

## Where it lives in our code

Not installed yet (SRS NFR-09). Requirements: [SRS](../../SRS.md). Planned: apps/web/src/shared/analytics, a Sentry setup file in `apps/web`, and a `FeatureFlags` port in `packages/api/src/ports/`. Port pattern example today: `packages/api/src/ports/clock.ts`.

## The 20% you need

- Events are named verb-noun (`pattern_generated`) with small, non-personal properties.
- Sentry gets a release and environment (`APP_ENV`, `APP_VERSION`, `GIT_SHA` already exist in `packages/config/src/env.ts`).
- Scrub personal data before sending.

## Commands you'll use

None yet; keys are set as environment variables through `packages/config/src/env.ts` when this is added.

## Common mistakes

- Sending body measurements, names or phone numbers to analytics.
- Calling the PostHog SDK directly from feature code instead of the wrapper.

## Learn more

- [Sentry for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/), [PostHog docs](https://posthog.com/docs) (official)
- Glossary: [Sentry](../glossary.md#sentry), [PostHog](../glossary.md#posthog), [feature flag](../glossary.md#feature-flag)
