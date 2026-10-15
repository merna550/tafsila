---
packages: [tsx]
level: beginner
adr: ADR-94
---

# tsx

**In one line:** Runs a TypeScript file directly with Node, so small scripts need no build step. Installed with #94.

## What it is (plain words)

Node cannot import our workspace TypeScript files (extensionless imports, `@tafsila/*` packages) by itself. `tsx` is a loader that compiles them on the fly. We use it only for developer scripts, never in the shipped app.

## Why we chose it

- The OpenAPI document is built from the real routes in `packages/api`, which are TypeScript; `tsx` runs the writer script and the throwaway test API with no extra build.
- MIT licence, small, no config file ([ADR-94](../../decisions/94-openapi-postman-newman.md), ADR-022).

## Alternatives we considered (and why not)

- **ts-node:** slower and needs more config for ESM.
- **Node's built-in type stripping:** does not resolve extensionless imports used by the workspace.
- **A build step with tsc:** one more output folder to keep in sync for a few scripts.

## When we would change it

When the Node version we run supports extensionless TypeScript imports natively.

## Where it lives in our code

- `packages/engine/scripts/print.ts` (`pnpm engine:print`, #127), run with `tsx` from `packages/engine`.
- `packages/api/src/openapi/write.ts` (`pnpm api:openapi`) and `packages/api/src/dev/test-server.ts` (`pnpm api:test`); `scripts/api-check.mjs` and `scripts/api-test.mjs` start them with `node --import tsx`.

## The 20% you need

- `node --import tsx file.ts` runs a TypeScript file; run it from `packages/api` so `tsx` resolves.
- It does not type-check; `pnpm typecheck` does.

## Commands you'll use

```bash
pnpm api:openapi
cd packages/api && node --import tsx src/dev/test-server.ts
```

## Common mistakes

- Using it in app code that ships to Vercel (the app is built by Next.js).

## Learn more

- [tsx docs](https://tsx.is)
