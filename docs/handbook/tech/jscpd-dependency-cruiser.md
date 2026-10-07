---
packages: [jscpd, dependency-cruiser]
level: intermediate
adr: ADR-013
---

# jscpd and dependency-cruiser

**In one line:** Two guards: jscpd blocks copy-pasted code, dependency-cruiser enforces who may import whom.

## What it is (plain words)

jscpd scans for blocks of code that appear twice and fails if any are found. dependency-cruiser reads the import graph and fails if an import breaks an architecture rule, for example the engine importing UI code.

## Why we chose it

- **Rules that only humans check do not survive agents.** "No duplication" and "layers point inward" ([CODING_STANDARDS section 1](../../CODING_STANDARDS.md)) are enforced by tools.
- **Engine purity.** `engine-is-pure` forbids the engine from touching apps, API, UI, the database or the network, so geometry stays deterministic and runs in the browser.
- **Vendor independence.** `services-use-ports-not-adapters` stops services from importing Supabase, Paymob or AI SDKs ([hexagonal](../patterns/hexagonal-ports-adapters.md)).
- **Cycles banned.** No circular imports.

## Alternatives we considered (and why not)

- **Code review only:** does not scale with agents.
- **Custom ESLint import rules alone:** weaker graph analysis and no duplicate detection.

## When we would change it

If the rule set grows beyond what the config can express, or a package moves; adjust `.dependency-cruiser.cjs` with the move, never loosen a rule just to pass.

## Where it lives in our code

- `.jscpd.json` (threshold and ignored paths), `.dependency-cruiser.cjs` (rules).
- `.github/workflows/quality.yml`; reports go to `reports/` (not committed).

## The 20% you need

```js
// .dependency-cruiser.cjs
{ name: "engine-is-pure", severity: "error", from: { path: "^packages/engine" },
  to: { path: ["^apps/", "^packages/(api|ui|ai|config)"] } }
```

- Duplicated code is fixed by extracting a function into the right shared package ([`packages/utils`](../../../packages/utils/src/index.ts) or the relevant package).

## Commands you'll use

```bash
pnpm jscpd
pnpm depcruise
```

## Common mistakes

- Silencing a duplicate with an ignore entry instead of extracting.
- Importing across packages via relative paths (`../../packages/...`) instead of the package name.

## Learn more

- [jscpd](https://github.com/kucherenko/jscpd#readme), [dependency-cruiser](https://github.com/sverweij/dependency-cruiser#readme) (official repos)
- Glossary: [jscpd](../glossary.md#jscpd), [dependency-cruiser](../glossary.md#dependency-cruiser), [layer](../glossary.md#layer)
