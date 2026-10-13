---
packages: [vitest, "@vitest/coverage-v8"]
level: beginner
adr: ADR-013
---

# Vitest

**In one line:** The test runner for unit, component, API and geometry tests.

## What it is (plain words)

Vitest finds `*.test.ts` files, runs them and reports passes and failures. It understands TypeScript directly and has a Jest-compatible API (`describe`, `it`, `expect`).

## Why we chose it

- **Fast and TypeScript-native:** no extra Babel or ts-jest setup, instant watch mode.
- **One runner for everything:** engine maths, Hono routes (`app.request(...)`), React components, config validation.
- **Coverage targets** (engine 85% or more, SRS NFR-10) come from its coverage support ([glossary: coverage](../glossary.md#coverage)). The engine uses `@vitest/coverage-v8` (MIT, free) and fails its `test` script below 85% lines, branches or functions (`packages/engine/vitest.config.ts`, [decision 124](../../decisions/124-geometry-kit.md)).
- **Familiar API,** so agents write tests correctly the first time.

## Alternatives we considered (and why not)

- **Jest:** slower TypeScript setup and ESM friction.
- **Node's built-in test runner:** fewer features (mocking, coverage UI, component support).

## When we would change it

Only if Vitest majors keep breaking. The repo is on 4.x while 5.x is released; upgrade as a small chore issue (checked on 2026-10-07).

## Where it lives in our code

- `packages/engine/src/geometry/point.test.ts`, `packages/api/src/app.test.ts`, `packages/ui/src/button.test.tsx`, `packages/config/src/env.test.ts`, `packages/utils/src/units.test.ts`.
- `packages/ui/vitest.config.ts`.
- Rules: `.claude/rules/testing.md`; shared data in `packages/test-fixtures`.

## The 20% you need

```ts
// packages/engine/src/geometry/point.test.ts
it("measures straight distances", () => {
  expect(distance(pt(0, 0), pt(30, 40))).toBe(50);
});
```

- Test the contract, not the implementation; use fixtures for realistic sizes.
- Floating-point maths uses `toBeCloseTo`.
- Bugs get a failing test first.

## Commands you'll use

```bash
pnpm test                          # all packages
pnpm --filter @tafsila/engine test # one package
```

## Common mistakes

- Comparing floats with `toBe`.
- Tests that depend on the current time or randomness (inject a clock, as `app.test.ts` does).

## Learn more

- [Vitest guide](https://vitest.dev/guide/) (official)
- Glossary: [Vitest](../glossary.md#vitest), [fixture](../glossary.md#fixture), [snapshot test](../glossary.md#snapshot-test)
