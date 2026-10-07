---
packages: [fast-check]
level: advanced
adr: ADR-013
---

# fast-check

**In one line:** Property-based testing: check that a geometry rule holds for hundreds of generated inputs, not three hand-picked sizes.

## What it is (plain words)

Instead of "for size 40 the armhole is 450 mm", you state a rule ("the sleeve cap seam is always longer than the armhole") and fast-check tries many random sizes. When one fails it shrinks it to the smallest failing case.

## Why we chose it

- **Patterns must be right for every size,** not just the sizes we tried. Property tests cover the whole size matrix and unusual measurement combinations ([glossary: property-based test](../glossary.md#property-based-test)).
- **Finds the edge cases agents and humans forget** (very small waist, very large bust difference).
- **Required by our rules** for engine validation ([CLAUDE.md rule 4](../../../CLAUDE.md)).

## Alternatives we considered (and why not)

- **Only example-based tests:** miss unexpected sizes.
- **jsverify and others:** less maintained.

## When we would change it

Unlikely. It is a dev dependency of `packages/engine` only.

## Where it lives in our code

- Dependency: `packages/engine/package.json`.
- Properties are written next to engine modules, such as `packages/engine/src/sleeve/sleeve-cap.test.ts`.
- Rules: `.claude/rules/engine/drafting.md`.

## The 20% you need

```ts
fc.assert(
  fc.property(fc.integer({ min: 300, max: 600 }), (armholeMm) => {
    // a rule that must hold for every armhole length
  }),
);
```

- Build arbitraries (generators) that produce only plausible measurements.
- Keep a seed from a failure to reproduce it.

## Commands you'll use

`pnpm --filter @tafsila/engine test`.

## Common mistakes

- Generators that allow impossible bodies, so tests fail for nonsense.
- Testing the implementation formula instead of an independent property.

## Learn more

- [fast-check docs](https://fast-check.dev/docs/introduction/) (official)
- Glossary: [fast-check](../glossary.md#fast-check), [property-based test](../glossary.md#property-based-test)
