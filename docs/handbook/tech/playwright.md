---
packages: ["@playwright/test"]
level: intermediate
adr: ADR-013
---

# Playwright

**In one line:** Drives a real browser to test full user flows, in Arabic and English. Planned for M1 onward.

## What it is (plain words)

Playwright opens Chromium, Firefox or WebKit, clicks and types like a user, and checks what the page shows. It can also take screenshots to compare against a saved image.

## Why we chose it

- **Real flows matter most:** upload a photo, confirm the design, get a pattern, print. Unit tests cannot prove the whole path works ([glossary: e2e test](../glossary.md#e2e-test)).
- **Multiple browsers including WebKit,** which covers iPhone Safari used by many customers.
- **RTL and mobile viewports** can be tested by project configuration (Arabic default, English second).
- **Visual snapshots** pair with pattern output checks.

## Alternatives we considered (and why not)

- **Cypress:** no WebKit, slower parallelism.

## When we would change it

Unlikely. Not installed yet: the first flow tests arrive with the first user screens.

## Where it lives in our code

Not installed yet. Planned: apps/web/e2e/ and the `pnpm test:e2e` script named in [CLAUDE.md](../../../CLAUDE.md). Test rules: `.claude/rules/testing.md`; manual cases: `docs/test-cases/`.

## The 20% you need

- Locate elements by role or label (`getByRole("button", { name: "..." })`), not by CSS class; this also checks accessibility.
- Each test starts from a clean seeded state ([seed data](../../backend/seed-data.md)).
- Run each flow in `ar` and `en`.

## Commands you'll use

Planned: `pnpm test:e2e`, `pnpm exec playwright test --ui`.

## Common mistakes

- Fixed `sleep` waits instead of waiting for visible state.
- Tests that depend on each other's data.

## Learn more

- [Playwright docs](https://playwright.dev/docs/intro) (official)
- Glossary: [Playwright](../glossary.md#playwright), [E2E test](../glossary.md#e2e-test)
