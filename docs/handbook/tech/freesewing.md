---
packages: ["@freesewing/core"]
level: intermediate
adr: ADR-001
---

# FreeSewing

**In one line:** An open-source JavaScript library for parametric sewing patterns, the base we build our blocks on. Planned for M2; not installed yet.

## What it is (plain words)

FreeSewing drafts patterns from measurements with code: you define points and paths, and it produces SVG pieces. Its core library is published on npm and works in Node and in the browser.

## Why we chose it

- **MIT licensed and proven.** Checked on 2026-10-07: the repository declares the MIT licence and `@freesewing/core` is published (version 4.10.2); MIT permits commercial use ([GitHub repo](https://github.com/freesewing/freesewing)).
- **Building on tested drafting maths** saves months compared with inventing blocks from zero, and gives us a vocabulary (points, paths, snippets, notches) our engine can mirror.
- **JavaScript,** so it runs in the browser engine with [TypeScript](typescript.md) ([ADR-001](../../DECISIONS.md)).
- **Our engine stays the authority.** We wrap FreeSewing behind `packages/engine` modules so results are deterministic, validated and covered by property tests.

## Alternatives we considered (and why not)

- **Write all drafting from scratch:** slow and risky for fit.
- **Closed CAD tools:** licensing, no automation, cannot run in our app.

## When we would change it

If its API changes break us or a garment type needs maths it cannot express, we keep only the geometry helpers we already have in `packages/engine/src/geometry/` and write our own blocks. Needs a sew test (`needs:sew-test`) either way.

## Where it lives in our code

- `packages/engine/src/` (pure engine; geometry helpers `packages/engine/src/geometry/point.ts` and `bezier.ts`).
- Engine docs: [docs/engine/README.md](../../engine/README.md).

## The 20% you need

- Everything is in millimetres; the engine is a pure function: same `DesignSpec` and measurements in, same pattern out.
- Parts are extended, never edited in place ([feature modules](../glossary.md#feature-module)).

## Commands you'll use

`pnpm test` in `packages/engine` (geometry and property tests).

## Common mistakes

- Letting FreeSewing code reach UI or network code (dependency-cruiser blocks it).
- Trusting a block without a real fabric test.

## Learn more

- [FreeSewing docs](https://freesewing.org/docs) (official)
- Glossary: [FreeSewing](../glossary.md#freesewing), [block](../glossary.md#block-sloper)
