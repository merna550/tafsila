---
packages: [turbo, "@turbo/gen"]
level: beginner
adr: ADR-001
---

# Turborepo

**In one line:** Runs build, test and typecheck across all packages in the right order, caching results, and slims the Docker build.

## What it is (plain words)

In a monorepo, `@tafsila/api` needs `@tafsila/schemas` built first. Turborepo reads that dependency graph, runs tasks in the right order and in parallel, and skips work whose inputs have not changed.

## Why we chose it

- **Right order, automatically:** `build` has `dependsOn: ["^build"]` in `turbo.json`.
- **Caching:** repeated `pnpm test` and `pnpm typecheck` runs are fast, which keeps agent feedback loops short and CI cheap.
- **`turbo prune`:** creates a minimal copy of the repo for one app, which our Dockerfile uses to make small images with cached dependency layers ([docker](docker.md)).
- **Light.** Little configuration, works with [pnpm](pnpm.md) out of the box.

## Alternatives we considered (and why not)

- **Nx:** more powerful, but heavier to learn and configure.
- **Plain scripts:** no caching, ordering by hand.

## When we would change it

If we need remote cache across CI and developers (Turborepo supports it, a free option exists), we add it. Replace only if tasks become too complex for `turbo.json`.

## Where it lives in our code

- `turbo.json` (task graph), root `package.json` scripts (`dev`, `build`, `test`, `typecheck`).
- `apps/web/Dockerfile` (the `pruner` stage runs `turbo prune web --docker`).
- Affected-only checks (ADR-017): `--filter=...[origin/main]` in the Stop hook (`scripts/hooks/verify-affected.sh`) and on PRs (`scripts/ci-scope.sh`). `globalDependencies` in `turbo.json` makes a change to `tsconfig.base.json` or `.nvmrc` count for every package. Turbo remote cache is not used yet; it is optional and would make repeated CI runs faster.

- `turbo/generators/config.ts` and `turbo/generators/templates/` (code generators, `pnpm gen`; see [Code generator](../glossary.md#code-generator)).

## The 20% you need

```json
// turbo.json
"build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] }
```

- `^build` means "build my dependencies first".
- `outputs` is what gets cached.
- `persistent: true` marks long-running tasks like `dev`.

## Commands you'll use

```bash
pnpm build
pnpm test
turbo run test --filter=@tafsila/engine
```

## Common mistakes

- Forgetting `outputs`, so nothing is cached.
- Reading an environment variable that is not declared as an input, causing stale cache hits.

## Learn more

- [Turborepo docs](https://turborepo.dev/docs) (official)
- Glossary: [Turborepo](../glossary.md#turborepo), [monorepo](../glossary.md#monorepo)
