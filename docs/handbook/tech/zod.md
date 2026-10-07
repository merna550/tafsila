---
packages: [zod, react-hook-form]
level: beginner
adr: ADR-001
---

# Zod

**In one line:** One schema that validates data at runtime and gives the TypeScript type, shared by the UI, API, engine and AI output.

## What it is (plain words)

You describe the shape of data once (`z.object({ bust: z.number().min(50) })`). Zod checks real data against it and returns either clean typed data or a readable list of errors. The TypeScript type comes from the same description.

## Why we chose it

- **A single source of truth.** `DesignSpec`, `Measurements` and `PatternResult` are defined once in `packages/schemas`; the form, the API body, the database mapper and the engine input all reuse them. See [schema-first contracts](../patterns/schema-first-contracts.md).
- **Safe AI.** AI output is untrusted text; we only accept it if it parses as a `DesignSpec` ([ADR-002](../../DECISIONS.md), [ai-providers](ai-providers.md)).
- **Exports JSON Schema** for the Python simulation service and for structured AI output, and feeds OpenAPI so docs and [Postman](postman-newman.md) never drift.
- **Config validation.** The app refuses to start with a bad environment because `packages/config/src/env.ts` is a Zod schema.
- **Forms.** React Hook Form (planned; listed here because it uses the same schemas) validates inputs with the same rules as the server.

## Alternatives we considered (and why not)

- **Yup:** weaker TypeScript inference.
- **io-ts:** functional style, steeper learning curve.
- **Valibot:** smaller, but a smaller ecosystem and less support in Hono, Vercel AI SDK and tooling.
- **TypeBox:** JSON Schema first; less ergonomic for refinements.

## When we would change it

If bundle size in the browser becomes an issue (Valibot is smaller). Schemas are isolated in `packages/schemas`, so a swap is contained.

## Where it lives in our code

- `packages/schemas/src/design-spec.ts`, `packages/schemas/src/measurements.ts`.
- `packages/config/src/env.ts` (environment schema), used by `packages/api`.

## The 20% you need

```ts
// packages/schemas/src/measurements.ts
const lengthMm = z.number().min(MIN_LENGTH_MM).max(MAX_LENGTH_MM);
export const measurementsSchema = z.object({ unit: z.literal("mm"), bust: lengthMm /* ... */ });
export type Measurements = z.infer<typeof measurementsSchema>;
```

- `schema.parse(x)` throws; `schema.safeParse(x)` returns `{ success, data | error }`.
- `z.enum([...])` is how closed lists (necklines, sleeve types) are defined.
- Zod 4 top-level helpers such as `z.url()` are used in `env.ts`.

## Commands you'll use

`pnpm typecheck` and `pnpm test` (see `packages/config/src/env.test.ts`).

## Common mistakes

- Writing a TypeScript `interface` that duplicates a schema.
- Using `parse` where you want to show errors to a user (use `safeParse`).
- Forgetting to bump the schema version and migration when `DesignSpec` changes shape.

## Learn more

- [Zod docs](https://zod.dev/) (official), [React Hook Form](https://react-hook-form.com/get-started) (official)
- Glossary: [Zod](../glossary.md#zod), [schema](../glossary.md#schema), [JSON Schema](../glossary.md#json-schema), [React Hook Form](../glossary.md#react-hook-form)
