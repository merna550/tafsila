# Tafsila — Coding Standards

Clean, readable, reusable code. Every rule marked **[enforced]** is checked by tooling in CI; a PR cannot merge if it fails.

## 1. Principles

1. **One responsibility per unit.** A function does one thing; a file has one purpose; a package owns one area.
2. **No duplication [enforced: jscpd].** Logic used in two places lives in one shared place and is imported. The second time you would copy code, extract it instead.
3. **Readable first.** Names explain intent; small functions; early returns instead of nested `if`s.
4. **Layers point inward [enforced: dependency-cruiser].** Backend: route → use case (`services/`) → domain → port → adapter. Frontend, per feature: UI (`components/`) → application (`hooks/`) → domain (`model/`) → data (`shared/api`). Use cases depend on port _interfaces_, never on Supabase/Paymob/AI SDKs; components never fetch (ADR-029).
5. **Explicit over clever.** No magic numbers (named constants with units), no hidden side effects, no `any` **[enforced]**.

## 2. Where code lives (decide before writing)

| You are writing…                                          | Put it in                                                                               | Not in                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------- |
| Pattern geometry, drafting maths, validation              | `packages/engine/src/<area>/`                                                           | UI, API                          |
| Data shapes (DesignSpec, Measurements, API bodies)        | `packages/schemas` (Zod)                                                                | redeclared types anywhere else   |
| Business logic (credits, versions, permissions)           | `packages/api/src/services/`                                                            | route handlers, React components |
| Talking to DB / storage / payments / AI                   | `packages/api/src/adapters/<service>/` behind an interface in `packages/api/src/ports/` | services, UI                     |
| HTTP routes                                               | `packages/api/src/routes/` (validate → call service → map result)                       | business logic inside routes     |
| Reusable UI (buttons, cards, inputs, layout, RTL helpers) | `packages/ui`                                                                           | copy-pasted JSX in pages         |
| Feature UI (one screen's parts)                           | `apps/web/src/features/<feature>/components/`                                           | `app/` route files               |
| Print tiles, PDF export                                   | `packages/export/src/`                                                                  | UI, API                          |
| Generic helpers (formatting, units, arrays)               | `packages/utils`                                                                        | a `utils.ts` inside every folder |
| Constants (ease tables, seam allowances, limits)          | `packages/engine/src/constants/` or `packages/config`                                   | inline numbers                   |
| Arabic/English strings                                    | `apps/web/messages/{ar,en}.json`                                                        | hard-coded text in components    |

Feature folder shape (web):

```
apps/web/src/features/measurements/
├─ components/        # presentational, props in → JSX out, no fetching
├─ hooks/             # data + state (useMeasurements, useSaveMeasurements)
├─ measurements.schema.ts   # re-exports/extends packages/schemas if needed
└─ index.ts           # the only public entry of the feature
```

## 3. Functions

- ≤ 40 lines **[enforced: max 60]**, cyclomatic complexity ≤ 10 **[enforced]**, nesting depth ≤ 3 **[enforced]**, cognitive complexity ≤ 15 **[enforced]**.
- ≤ 3 positional parameters; more → one typed options object **[enforced: max 4]**.
- Pure where possible (always in `packages/engine`): same input → same output, no I/O, no `Date.now()`, no randomness.
- Return typed results; throw only domain errors (`DraftingError`, `ValidationError`, `NotFoundError`) defined in one place.

## 4. Components (React)

- Presentational components receive data via props and render; container hooks fetch and mutate. No `fetch`/Supabase calls inside components.
- Build screens from `packages/ui` components; if a pattern appears twice, it becomes a `packages/ui` component.
- Style only with design tokens (`packages/ui/src/tokens.css`) **[enforced: ESLint + `pnpm tokens:check`]**: no raw colours, no arbitrary Tailwind values (`bg-[...]`), no physical direction classes (`ml-*`, `left-*`), no hard-coded user-facing text in JSX.
- Errors reach the user through one path: `shared/api` throws `ApiError`, `placementFor` picks the place (field, toast, ErrorState, redirect, banner). See `docs/errors.md`.
- Per-area rules with right/wrong examples: `.claude/rules/frontend/`, `.claude/rules/backend/`, `.claude/rules/engine/`.
- Props are typed interfaces with JSDoc; no prop drilling deeper than 2 levels (use a hook or context).
- Every user-facing string comes from the messages files; layout uses logical CSS (`ms-*`/`me-*`, `start`/`end`) so RTL works.

### Screens from a design (`docs/design/`)

- A screen issue must match its file in `docs/design/screens/` (layout, spacing, states, copy).
- Values come from tokens and `packages/ui` components, never raw hex or px from the design files.
- Arabic copy from the design goes to `ar.json`; the English equivalent to `en.json`, following `docs/design/copy.md`.
- Logical CSS only; the LTR exceptions (phone, email, OTP) and icon flipping are listed in `docs/design/screens/README.md`.
- The PR for a screen includes screenshots of the built screen in **both** `ar` and `en`, at 1280 px and 360 px.

## 5. Comments and documentation [enforced: eslint-plugin-jsdoc]

Every function, React component, class, exported type and interface has a JSDoc block that states **its purpose** (what it is for and why it exists), then params/returns/throws, and an example when the use is not obvious. Comments inside a function explain _why_, never repeat _what_ the code says. `TODO` must reference an issue: `// TODO(#42): …`.

Template:

```ts
/**
 * <One sentence: what this does and what it is for.>
 * <Optional: where it is used / which rule or requirement it serves (SRS ID).>
 *
 * @param <name> - <meaning, unit, allowed range>
 * @returns <what comes back, unit>
 * @throws {<ErrorType>} <when>
 * @example
 * <short call and result>
 */
```

Example:

```ts
/**
 * Finds the sleeve-cap height that makes the cap seam longer than the armhole by the requested ease,
 * so a set-in sleeve can be eased into the bodice (SRS FR-VAL-02).
 *
 * @param armholeLengthMm - Front + back armhole seam length of the bodice, in mm.
 * @param bicepWidthMm - Sleeve width at the bicep line including ease, in mm.
 * @param capEaseMm - Extra cap length to ease in, in mm (woven fabrics: 10–40).
 * @returns Cap height in mm.
 * @throws {DraftingError} If no height between MIN_CAP_HEIGHT_MM and MAX_CAP_HEIGHT_MM gives that ease.
 * @example
 * solveSleeveCapHeight(420, 340, 20) // ≈ 126
 */
export function solveSleeveCapHeight(armholeLengthMm: number, bicepWidthMm: number, capEaseMm: number): number {
  // Bisection: cap length grows monotonically with height, so the search always converges.
  …
}
```

Each file starts with a one-line module comment: `/** Sleeve drafting: set-in sleeve block and cap fitting. */`

## 6. Naming

| Thing                      | Style                               | Example                                 |
| -------------------------- | ----------------------------------- | --------------------------------------- |
| Files                      | kebab-case                          | `sleeve-cap.ts`, `measurement-form.tsx` |
| Components, types, classes | PascalCase                          | `MeasurementForm`, `DesignSpec`         |
| Functions, variables       | camelCase, verb-first for functions | `draftFrontBodice`, `isWovenFabric`     |
| Constants                  | UPPER_SNAKE with unit suffix        | `DEFAULT_SEAM_ALLOWANCE_MM`             |
| Booleans                   | `is/has/can/should` prefix          | `hasLining`                             |
| Units                      | always in the name when numeric     | `lengthMm`, `priceEgp`, `timeoutMs`     |

## 7. Tests

Tests sit next to the code (`sleeve-cap.test.ts`) and follow Arrange–Act–Assert; one behaviour per test; test names read as sentences: `it("adds 2 cm of ease to the sleeve cap for woven fabric")`. Shared fixtures (sizes, measurement sets, designs) live in `packages/test-fixtures`, never copied between test files.

## 8. Enforcement

| Check                                                                            | Tool                                                               | Where           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------- |
| Formatting                                                                       | Prettier                                                           | pre-commit + CI |
| Lint, complexity, JSDoc on every function, no `any`, import cycles               | ESLint (`eslint.config.mjs`)                                       | pre-commit + CI |
| Duplicate code (≥ 50 tokens)                                                     | jscpd (`.jscpd.json`)                                              | CI              |
| Layer rules (who may import whom, frontend and backend)                          | dependency-cruiser (`.dependency-cruiser.cjs`)                     | CI              |
| Tokens only, logical direction, no literal UI text, `fetch` only in `shared/api` | ESLint (`eslint-rules/frontend.mjs`) and `pnpm tokens:check` (CSS) | pre-commit + CI |
| Every thrown error code is in the catalogue with an Arabic message               | `packages/api/src/domain/errors.test.ts`                           | CI              |
| Types                                                                            | `tsc --noEmit` strict                                              | CI              |
| Review checklist                                                                 | `/review` command                                                  | before every PR |

Run all locally: `pnpm quality` (= format check + lint + typecheck + duplication + architecture + tokens + docs).
