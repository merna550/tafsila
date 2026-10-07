# Schema-first contracts

**One-line idea:** define each data shape once as a schema; derive the TypeScript type and the runtime validation from it, and let every part of the system import it.

## Plain words

A **schema** describes what valid data looks like ("`category` is `dress`, `skirt` or `blouse`"). With [Zod](https://zod.dev/) one definition gives you both a runtime check (reject bad data) and a compile-time type (`z.infer`). A **contract** is a shape two parts have agreed on, so changing it in one place shows every place that must adapt.

## Why Tafsila uses it

- **AI safety:** AI output must pass `designSpecSchema` before the engine sees it; invalid output is retried once, then the person edits by hand ([ADR-002](../../DECISIONS.md), [SRS section 3.3](../../SRS.md)).
- **No drifting copies:** web, API and engine share the same `DesignSpec` and `Measurements` ([CODING_STANDARDS section 2](../../CODING_STANDARDS.md): "redeclared types anywhere else" is forbidden).
- The `PatternResult` JSON is the contract between engine, exports and the future Python simulation ([SRS 6.3](../../SRS.md)); JSON Schema is to be generated from the Zod schemas ([ARCHITECTURE section 4](../../ARCHITECTURE.md)).

## Where in our code

| What                                                       | File                                             |
| ---------------------------------------------------------- | ------------------------------------------------ |
| `designSpecSchema` and `type DesignSpec`                   | `packages/schemas/src/design-spec.ts`            |
| `measurementsSchema` (all lengths in mm, with min and max) | `packages/schemas/src/measurements.ts`           |
| Public entry                                               | `packages/schemas/src/index.ts`                  |
| Environment variables validated the same way               | `packages/config/src/env.ts` (`serverEnvSchema`) |
| A typed fixture that must satisfy the contract             | `packages/test-fixtures/src/designs.ts`          |
| Rule that schemas depend on nothing but Zod                | `schemas-are-leaf` in `.dependency-cruiser.cjs`  |

Excerpt from `packages/schemas/src/design-spec.ts`:

```ts
export const garmentCategorySchema = z.enum(["dress", "skirt", "blouse"]);
// ...
/** A validated garment design. */
export type DesignSpec = z.infer<typeof designSpecSchema>;
```

`PatternResult`, API request and response bodies, and the generated OpenAPI are **planned** ([SRS sections 6.3 and 8](../../SRS.md)).

## Learn more

- [Zod documentation](https://zod.dev/)
- [JSON Schema](https://json-schema.org/understanding-json-schema)
- Related: [functional core](functional-core-plugin-pipeline.md), [pattern journey](../map/pattern-journey.md)
