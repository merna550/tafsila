---
packages:
  [
    eslint,
    "@eslint/js",
    typescript-eslint,
    eslint-plugin-jsdoc,
    eslint-plugin-sonarjs,
    eslint-plugin-import-x,
    eslint-config-prettier,
    globals,
    prettier,
  ]
level: intermediate
adr: ADR-013
---

# ESLint and Prettier

**In one line:** Automatic enforcement of our coding standards: JSDoc on every function, complexity limits, no `any`, and one consistent format.

## What it is (plain words)

ESLint reads code and reports rule violations (a function too long, a missing comment). Prettier rewrites code into one standard layout so nobody argues about spaces or quotes. Plugins add rules: `eslint-plugin-jsdoc` (documentation), `eslint-plugin-sonarjs` (complexity), `eslint-plugin-import-x` (import hygiene), `typescript-eslint` (type-aware rules), `eslint-config-prettier` (turns off rules that fight Prettier).

## Why we chose it

- **Agents write most of the code,** so rules must be mechanical, not left to review. `pnpm lint` fails the build when a function lacks a purpose comment, exceeds complexity 10 or 15 cognitive, nests deeper than 3, or uses `any` ([CODING_STANDARDS](../../CODING_STANDARDS.md)).
- **Clean code for a solo founder:** small, documented functions are the reason the codebase stays understandable months later.
- **Consistent format** removes noise from diffs: `pnpm format:check` in CI.
- **Flat config in one file** (`eslint.config.mjs`), versioned with the repo.

## Alternatives we considered (and why not)

- **Biome:** much faster, but lacks the plugins we rely on (JSDoc purpose rules, SonarJS complexity).
- **Review only:** does not scale with agents writing code all day.

## When we would change it

When Biome (or another tool) supports the JSDoc and complexity rules we need, or ESLint major releases lag behind our plugins (they have in the past; the repo currently runs ESLint 10).

## Where it lives in our code

- `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`.
- CI: `.github/workflows/quality.yml`; hooks: [husky-lint-staged](husky-lint-staged.md).

## The 20% you need

```js
// eslint.config.mjs
"jsdoc/require-jsdoc": ["error", { publicOnly: false, require: { FunctionDeclaration: true } }],
complexity: ["error", 10],
"max-depth": ["error", 3],
```

- Fix lint errors, do not disable rules. A disable comment needs a reason and an issue reference.

## Commands you'll use

```bash
pnpm lint            # ESLint, zero warnings allowed
pnpm format          # Prettier writes
pnpm format:check
pnpm quality         # everything, as CI does
```

## Common mistakes

- Adding `eslint-disable` to silence a real design problem.
- Writing JSDoc that repeats the name ("gets the user") instead of the purpose ([code style](../code-style.md)).

## Learn more

- [ESLint docs](https://eslint.org/docs/latest/), [typescript-eslint](https://typescript-eslint.io/), [Prettier docs](https://prettier.io/docs/)
- Glossary: [ESLint](../glossary.md#eslint), [JSDoc](../glossary.md#jsdoc), [linting](../glossary.md#linting), [formatting](../glossary.md#formatting), [Prettier](../glossary.md#prettier)
