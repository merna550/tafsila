---
packages: [typescript, typescript-eslint]
level: beginner
adr: ADR-001
---

# TypeScript

**In one line:** JavaScript with types, used for the web app, the API and the pattern engine, so one language runs everywhere.

## What it is (plain words)

TypeScript is JavaScript plus a type checker. You describe the shape of your data (`number`, `string`, "an object with a `bust` in millimetres"), and the compiler refuses to build code that breaks that description. It compiles away to normal JavaScript, so it runs in browsers and in Node.js.

## Why we chose it

- **One language for the whole product.** A solo founder cannot maintain a frontend language, a backend language and a drafting language. TypeScript covers [Next.js](nextjs.md), the [Hono](hono.md) API and the engine in `packages/engine` ([ADR-001](../../DECISIONS.md)).
- **The engine must run in the browser.** Editing a neckline should re-draw the pattern instantly, without a server round trip, and the same engine must also run on the server to produce PDFs and validate saved patterns. Only JavaScript/TypeScript runs in both places.
- **Types catch geometry and unit mistakes early.** A pattern is millimetres, angles and curves. Mixing centimetres with millimetres, or passing a point where a length is expected, is caught while typing instead of on printed fabric. `strict` mode is on in `tsconfig.base.json`, and `no any` is enforced by lint ([CODING_STANDARDS section 1](../../CODING_STANDARDS.md)).
- **AI agents write it very reliably.** Most of Tafsila is written by Claude agents; typed code gives them immediate, mechanical feedback (`pnpm typecheck`) when they are wrong.
- **Shared contracts.** Types are inferred from [Zod](zod.md) schemas, so the UI, API and engine agree on `DesignSpec` and `Measurements` by construction.

## Alternatives we considered (and why not)

- **Python:** cannot run in the browser for live preview, and would mean two languages for all business logic. We keep Python only for the v2 cloth simulation ([python-fastapi-garmentcode](python-fastapi-garmentcode.md)).
- **Plain JavaScript:** no compile-time protection for units and shapes; agents would produce more silent bugs.

## When we would change it

Almost never; it is the foundation. We track new major TypeScript releases (the repo uses 6.x; 7.x, the native compiler, exists and may be adopted when the lint and build tools support it). Revisit only if a compiled language (for example Rust to WebAssembly) is needed for engine speed on large nesting jobs.

## Where it lives in our code

- `tsconfig.base.json` (strict settings shared by every package) and `tsconfig.json` (project references).
- Every package has its own `tsconfig.json`, for example `packages/engine/tsconfig.json`.
- Types inferred from schemas: `packages/schemas/src/measurements.ts`.

## The 20% you need

- `interface` / `type` describe shapes; `readonly` stops accidental changes.
- Prefer inferring types from a schema instead of writing them twice:

```ts
// packages/schemas/src/measurements.ts
export const measurementsSchema = z.object({ unit: z.literal("mm"), height: lengthMm /* ... */ });
export type Measurements = z.infer<typeof measurementsSchema>;
```

- `unknown` plus validation is safer than `any`. Use `import type` for type-only imports.

## Commands you'll use

- `pnpm typecheck` runs `tsc` in every package through [Turborepo](turborepo.md).
- `pnpm lint` also applies the type-aware rules from [typescript-eslint](eslint-prettier.md).

## Common mistakes

- Reaching for `any` or `as` to silence an error (lint blocks `any`; fix the type instead).
- Redeclaring a type that already exists in `packages/schemas`.
- Forgetting that types vanish at runtime: data from outside (HTTP, AI) must be validated with Zod.

## Learn more

- [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html) (official)
- [Total TypeScript tutorials](https://www.totaltypescript.com/tutorials) (free beginner material)
- Glossary: [TypeScript](../glossary.md#typescript), [typecheck](../glossary.md#typecheck)
