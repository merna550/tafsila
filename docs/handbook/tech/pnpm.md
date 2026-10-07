---
packages: [pnpm, corepack]
level: beginner
adr: ADR-001
---

# pnpm (with corepack, nvm and `.nvmrc`)

**In one line:** Our package manager and workspace tool, with the exact versions pinned per project so nothing on the Mac conflicts.

## What it is (plain words)

pnpm installs the libraries listed in each `package.json` and links the packages of our monorepo together. Corepack is a Node feature that downloads the exact pnpm version named in `package.json`. nvm switches Node versions per folder using `.nvmrc`.

## Why we chose it

- **Fast and disk-efficient:** one shared store, hard links into each `node_modules`.
- **Strict.** A package can only import what it declares, so no "phantom dependencies" that work by accident; this protects our layering ([monorepo](../glossary.md#monorepo)).
- **Great workspaces:** `packages/*` and `apps/*` depend on each other with `workspace:*`.
- **Our own "virtual environment".** `.nvmrc` (Node), `packageManager` and `engines` in `package.json` (pnpm), `.npmrc` (`engine-strict=true`) and a lockfile pin everything per project, so other projects on the same Mac use different versions without conflict ([bootstrap](../../backend/tutorials/run-locally.md)).

## Alternatives we considered (and why not)

- **npm:** slower and looser about undeclared imports.
- **Yarn:** similar to pnpm but less strict and less common in new projects.

## When we would change it

If a major pnpm release breaks Turborepo or Docker builds. Note: corepack is bundled with Node 22 and 24 but is no longer shipped from Node 25 onwards; when we move Node versions, check `corepack enable` still works or install pnpm through the pnpm action and a standalone installer.

## Where it lives in our code

- `package.json` (`packageManager: pnpm@10.34.6`, `engines`), `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.npmrc`, `.nvmrc`.
- `scripts/bootstrap.sh` (one-time setup), `.github/workflows/quality.yml` (installs with `--frozen-lockfile`).

## The 20% you need

- `pnpm add <pkg> --filter @tafsila/api` adds a dependency to one package.
- Internal packages are referenced with `workspace:*`.
- Never edit `pnpm-lock.yaml` by hand; commit it.

## Commands you'll use

```bash
pnpm install              # install everything (CI uses --frozen-lockfile)
pnpm --filter web dev     # run one workspace
pnpm add -D vitest --filter @tafsila/utils
```

## Common mistakes

- Using `npm install` (creates a second lockfile).
- Importing a package that is not in that package's `package.json`.
- Running with the wrong Node version ([troubleshooting](../troubleshooting.md#pnpm-dev-fails-wrong-node-version)).

## Learn more

- [pnpm docs](https://pnpm.io/motivation) (official), [Corepack](https://nodejs.org/api/corepack.html), [nvm](https://github.com/nvm-sh/nvm#readme)
- Glossary: [pnpm](../glossary.md#pnpm), [corepack](../glossary.md#corepack), [lockfile](../glossary.md#lockfile), [workspace](../glossary.md#workspace)
