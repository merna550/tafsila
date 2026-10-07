---
packages: [husky, lint-staged]
level: beginner
adr: ADR-013
---

# Husky and lint-staged

**In one line:** Before every commit, format and lint only the files you changed, so broken code never reaches CI.

## What it is (plain words)

Husky installs a Git hook: a script Git runs before it completes a commit. lint-staged runs a tool (Prettier, ESLint) only on the files staged for that commit, so it takes seconds.

## Why we chose it

- **Fast feedback.** A style or lint error is found on your machine before pushing, not minutes later in CI.
- **Safe for agents:** the same checks apply to every commit, no matter who or what wrote it.
- **Cheap:** only staged files, so it does not slow the commit down.

## Alternatives we considered (and why not)

- **CI only:** slower feedback and more failed pushes. CI still runs the full check as the final gate.

## When we would change it

If hooks get slow or annoying, move heavier checks to CI and keep only formatting local. Never rely on hooks alone: they can be skipped with `--no-verify`.

## Where it lives in our code

- `.husky/pre-commit` (runs `pnpm exec lint-staged`).
- `package.json` (`lint-staged` section, `prepare` script that installs hooks).

## The 20% you need

```json
"lint-staged": {
  "*.{ts,tsx,mjs,cjs}": ["prettier --write", "eslint --max-warnings 0"],
  "*.{json,md,yml,yaml,css}": ["prettier --write"]
}
```

## Commands you'll use

`pnpm install` (the `prepare` script installs the hook). Run the same checks manually with `pnpm quality`.

## Common mistakes

- Using `git commit --no-verify` to get past an error.
- Hooks missing after a fresh clone because `pnpm install` was not run.

## Learn more

- [Husky docs](https://typicode.github.io/husky/), [lint-staged](https://github.com/lint-staged/lint-staged#readme) (official)
- Glossary: [Husky](../glossary.md#husky)
