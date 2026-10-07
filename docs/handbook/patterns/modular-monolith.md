# Modular monolith

**One-line idea:** one repository and one deployable app, split inside into parts that only talk through clear contracts.

## Plain words

A _monolith_ is one program deployed as a unit. A _microservice_ design splits it into many programs that talk over the network. A **modular monolith** keeps the single deployment (simple, cheap, one place to debug) but enforces borders inside, so any part can be pulled out later without a rewrite.

## Why Tafsila uses it

- One developer plus AI agents: one repo, one CI run and one pull request per feature ([ADR-005](../../DECISIONS.md)).
- The pattern engine must run in the browser **and** on the server, so it is a package that both import.
- Later splits are already planned as small steps ([ARCHITECTURE section 7](../../ARCHITECTURE.md)): run `packages/api` as its own container, or enable `services/sim`.

## How the borders work

| Border                                                                                   | Enforced by                                          |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Each part is a [workspace](../glossary.md#workspace) package with its own `package.json` | `pnpm-workspace.yaml`                                |
| Parts share data only through `packages/schemas`                                         | Rule `schemas-are-leaf` in `.dependency-cruiser.cjs` |
| The engine imports no app, API, UI or database code                                      | Rule `engine-is-pure`                                |
| The UI never imports API services or adapters                                            | Rule `ui-not-backend`                                |
| No circular imports                                                                      | Rule `no-circular`                                   |

`pnpm depcruise` (part of `pnpm quality`) fails the build when a border is crossed.

## Where in our code

- `apps/web`, `packages/api`, `packages/engine`, `packages/schemas`, `packages/ui`, `packages/config`, `packages/utils`, `packages/test-fixtures`, `services/sim` (see [repo tour](../map/repo-tour.md)).
- `apps/web/src/app/api/[[...route]]/route.ts` mounts the whole API inside Next.js: the "one deployable" part. The same `createApp()` from `packages/api/src/app.ts` can run standalone later.
- `apps/web/next.config.ts` lists the internal packages under `transpilePackages`, so they are compiled from source.

## Learn more

- [Martin Fowler: MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html)
- [pnpm workspaces](https://pnpm.io/workspaces) · [Turborepo: structuring a repository](https://turborepo.com/docs/crafting-your-repository/structuring-a-repository)
- Related: [hexagonal ports and adapters](hexagonal-ports-adapters.md), [overview map](../map/overview.md)
