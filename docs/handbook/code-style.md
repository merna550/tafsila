# Code style, explained

A plain-English walk through [CODING_STANDARDS.md](../CODING_STANDARDS.md). That file holds the rules and is the source of truth; this page explains why each rule exists and shows it in real code. If this page and the standards ever disagree, the standards win. Fix this page.

"After" examples are real files in this repo (path shown). "Before" examples are made-up illustrations of what the rule prevents; they are not from our code.

## Why so strict?

Most of the code is written by AI agents and reviewed by one person. Rules that a tool can check are rules nobody has to remember: `pnpm quality` runs them all and CI blocks a merge that fails ([CODING_STANDARDS section 8](../CODING_STANDARDS.md)).

| Command             | Checks                                                                                 | Config                    |
| ------------------- | -------------------------------------------------------------------------------------- | ------------------------- |
| `pnpm format:check` | Formatting ([Prettier](https://prettier.io/docs/))                                     | `.prettierrc.json`        |
| `pnpm lint`         | Complexity, JSDoc, no `any`, import cycles ([ESLint](https://eslint.org/docs/latest/)) | `eslint.config.mjs`       |
| `pnpm typecheck`    | Types ([TypeScript](https://www.typescriptlang.org/docs/))                             | `tsconfig*.json`          |
| `pnpm jscpd`        | Copy-pasted code                                                                       | `.jscpd.json`             |
| `pnpm depcruise`    | Who may import whom                                                                    | `.dependency-cruiser.cjs` |

## 1. Principles

### One responsibility per unit

A function does one thing. `packages/engine/src/sleeve/sleeve-cap.ts` has `buildHalfCap` (shape), `capLength` (measure) and `solveSleeveCapHeight` (search): three small jobs, three functions, each reusable on its own.

### No duplication

Logic used twice lives once and is imported. Example: the mm/cm conversion exists only in `packages/utils/src/units.ts` (`cmToMm`, `mmToCm`), so every part of the app agrees on the factor (`MM_PER_CM`).

Before (illustrative):

```ts
const mmA = cmA * 10; // in a form
const mmB = cmB * 10; // in the engine, copied
```

After (`packages/utils/src/units.ts`):

```ts
export function cmToMm(cm: number): number {
  return cm * MM_PER_CM;
}
```

### Readable first: early returns, small functions

Before (illustrative):

```ts
function price(user) {
  if (user) {
    if (user.credits > 0) {
      return 0;
    } else {
      return 20;
    }
  }
}
```

After: flat code with guard clauses at the top, e.g. `solveSleeveCapHeight` first rejects an impossible target (`throw new DraftingError(...)`) and only then runs the search loop.

### Layers point inward

UI to API routes to services to engine and schemas. Services use ports, never SDKs. Enforced by `.dependency-cruiser.cjs`. Full explanation: [hexagonal ports and adapters](patterns/hexagonal-ports-adapters.md).

### Explicit over clever: no magic numbers, no `any`

Before (illustrative): `if (len > 250) ...` (250 what?).

After (`packages/engine/src/sleeve/sleeve-cap.ts`):

```ts
/** Lowest and highest sleeve-cap heights the solver will consider, in mm. */
export const MIN_CAP_HEIGHT_MM = 50;
export const MAX_CAP_HEIGHT_MM = 250;
```

## 2. Where code lives

The "where does it go" table is in [CODING_STANDARDS section 2](../CODING_STANDARDS.md). The short version: geometry in `packages/engine`, data shapes in `packages/schemas`, business rules in `packages/api/src/services`, vendors behind ports and adapters, reusable UI in `packages/ui`, strings in `messages/{ar,en}.json`. A map of every folder is in the [repo tour](map/repo-tour.md).

## 3. Functions

Limits are set by lint rules: about 40 lines (hard stop 60), at most 3 positional parameters (hard stop 4), nesting depth 3, complexity 10. When a function needs more than three inputs, pass one typed object. Real example: `solveSleeveCapHeight(input: SleeveCapInput)` takes `{ armholeLengthMm, bicepWidthMm, capEaseMm }` instead of three loose numbers, so the call reads clearly and arguments cannot be swapped by mistake.

Pure functions (always in the engine) return the same output for the same input and touch nothing outside. See [functional core](patterns/functional-core-plugin-pipeline.md).

Errors: throw typed domain errors, not bare strings. `DraftingError` (`packages/engine/src/errors/drafting-error.ts`) carries a stable `code` such as `SLEEVE_CAP_UNSOLVABLE`; `AppError` and `NotFoundError` (`packages/api/src/domain/errors.ts`) carry an HTTP status and Arabic and English messages.

## 4. Components (React)

Presentational components receive props and render. Fetching lives in hooks. Reusable pieces go into `packages/ui`. All visible text comes from the messages files, and layout uses logical CSS so Arabic (right to left) works.

Real example: `packages/ui/src/button.tsx` is a typed component with one `variant` prop instead of ad-hoc styles per page. Its Tailwind classes are in a constant (`VARIANT_CLASSES`), not scattered through JSX.

(The home page `apps/web/src/app/page.tsx` has Arabic text written directly in JSX. That is a milestone M0 placeholder; real screens use `messages/{ar,en}.json` as described in the [frontend docs](../frontend/README.md).)

## 5. Comments and JSDoc

**Every function, component, class, exported type and interface has a JSDoc block that says what it is for.** ESLint fails the build otherwise (`eslint-plugin-jsdoc`). Comments inside functions explain _why_, never _what_.

Before (illustrative):

```ts
// loop 60 times
for (let i = 0; i < 60; i += 1) {
```

After (`packages/engine/src/sleeve/sleeve-cap.ts`): the number is a named constant with a reason:

```ts
/** Safety limit on solver iterations (bisection halves the range each time). */
const MAX_ITERATIONS = 60;
```

A complete JSDoc block, from `packages/utils/src/units.ts`:

```ts
/**
 * Converts centimetres (what users type) to millimetres (what the engine uses).
 *
 * @param cm - Length in centimetres.
 * @returns Length in millimetres.
 * @example
 * cmToMm(92) // 920
 */
```

Each file also starts with a one-line module comment, and every `TODO` must name an issue: `// TODO(#42): ...`.

## 6. Naming

| Thing              | Style                        | Real example                                |
| ------------------ | ---------------------------- | ------------------------------------------- |
| Files              | kebab-case                   | `sleeve-cap.ts`, `system-clock.ts`          |
| Types, components  | PascalCase                   | `SleeveCapInput`, `Button`, `DraftingError` |
| Functions          | camelCase, verb first        | `solveSleeveCapHeight`, `createSystemClock` |
| Constants          | UPPER_SNAKE with unit suffix | `MIN_CAP_HEIGHT_MM`, `MM_PER_CM`            |
| Numbers with units | unit in the name             | `armholeLengthMm`, `capEaseMm`              |

The unit in the name is the most useful habit in this project: a value called `length` could be mm, cm or inches; `lengthMm` cannot be misread.

## 7. Tests

Tests sit next to the code (`sleeve-cap.test.ts`, `units.test.ts`, `app.test.ts`), follow Arrange, Act, Assert, check one behaviour each, and have names that read as sentences. Shared sizes, measurements and designs come from `packages/test-fixtures`, never copied between files.

Kinds of tests used here ([SRS section 11](../SRS.md)): unit tests ([Vitest](https://vitest.dev/guide/)); property-based tests for engine rules ([fast-check](https://fast-check.dev/docs/introduction/), planned with the first validation rules); snapshot tests for SVG output (planned); end-to-end tests with [Playwright](https://playwright.dev/docs/intro) (planned). Path rules for tests: `.claude/rules/testing.md`. See the glossary entries for [property-based test](glossary.md#property-based-test), [snapshot test](glossary.md#snapshot-test) and [e2e test](glossary.md#e2e-test).

## 8. Commits and pull requests

Small [conventional commits](glossary.md#conventional-commits) that mention the issue, for example `docs(handbook): add glossary (#8)`. One issue, one branch, one pull request; the Definition of Done is in [WORKFLOW section 5](../WORKFLOW.md).
