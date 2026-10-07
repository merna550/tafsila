---
packages: []
level: beginner
adr: ADR-001
---

# Node.js

**In one line:** The JavaScript runtime that runs our backend, our build tools and the Next.js server, pinned to the 22 LTS line.

## What it is (plain words)

Node.js lets JavaScript run outside a browser: it starts servers, reads files and runs tools such as pnpm, ESLint and Vitest. In Tafsila it is both the runtime of the production web container and the engine that executes every developer command.

## Why we chose it

**Why Node.js on the backend (and not Python or Go)?**

- **It runs the same TypeScript as the frontend and the engine.** Shared [Zod](zod.md) schemas, the shared pattern engine and the shared utilities are imported directly, with no translation layer and no duplicated types. A Python backend would need every schema and rule re-declared in a second language and kept in sync by hand.
- **It is the native runtime of [Next.js](nextjs.md) and Vercel.** The API is a [Hono](hono.md) app mounted inside Next.js at `/api` ([ADR-005](../../DECISIONS.md)); that only works on Node (or another JavaScript runtime).
- **Huge ecosystem with first-class JavaScript SDKs.** [Supabase](supabase.md), [Paymob](paymob-fawry.md), the [Anthropic and Gemini SDKs](ai-providers.md) and [Inngest](inngest.md) all ship official JS/TS clients.
- **One language, one toolchain.** One person has to learn, upgrade and debug the stack alone.
- **Pinned to an LTS line (22)** for stability: `.nvmrc`, `package.json` `engines` and the Dockerfile `NODE_VERSION` all say 22, and `engine-strict=true` in `.npmrc` makes installs fail on the wrong version.
- **Python only where it is truly better:** cloth simulation with GarmentCode in `services/sim` (v2), see [python-fastapi-garmentcode](python-fastapi-garmentcode.md).

## Alternatives we considered (and why not)

- **Python / FastAPI** for the backend: a second language for all business logic, and the engine could not be shared with the browser.
- **Go or Java:** no code sharing with the frontend and engine, slower to build alone.
- **Bun or Deno:** faster and attractive, but Node LTS has the widest hosting and library support (Vercel, Docker images, every SDK). Because Hono uses web-standard `Request`/`Response`, moving the API to Bun or Deno later is cheap.

## When we would change it

- **Move the pin forward before Node 22 leaves support.** Checked on 2026-10-07 against the official [release schedule](https://github.com/nodejs/Release/blob/main/schedule.json): Node 22 is in Maintenance LTS until **2027-04-30**; Node 24 is LTS until 2028-04-30; Node 26 becomes LTS on 2026-10-28. Plan the move to 24 (or 26) in the first half of 2027 at the latest, as a small chore issue that updates `.nvmrc`, `engines` and the Dockerfile together.
- Consider Bun/Deno only if Node becomes a measurable performance or cost problem.

## Where it lives in our code

- `.nvmrc` (version used by nvm and CI), `package.json` (`engines`), `.npmrc` (`engine-strict`).
- `apps/web/Dockerfile` (`ARG NODE_VERSION=22`, Alpine image).
- `scripts/bootstrap.sh` (installs the right Node through nvm).

## The 20% you need

- Check the version: `node --version` must be 22.x. `nvm use` reads `.nvmrc`.
- `process.env` holds environment variables, but we never read it directly: only `packages/config/src/env.ts` does, after Zod validation.
- Node is single threaded for JavaScript; long work (AI analysis, PDFs) goes to background jobs ([Inngest](inngest.md)).

## Commands you'll use

```bash
nvm use            # switch to the project's Node version
node --version
pnpm dev           # runs the web app on Node
```

## Common mistakes

- Running with the system Node instead of the project one (see [troubleshooting](../troubleshooting.md#pnpm-dev-fails-wrong-node-version)).
- Changing the Node version in one place only (it appears in four).

## Learn more

- [Node.js docs](https://nodejs.org/docs/latest-v22.x/api/) (official) and [release schedule](https://nodejs.org/en/about/previous-releases)
- [nvm](https://github.com/nvm-sh/nvm#readme)
- Glossary: [Node.js](../glossary.md#node), [nvm](../glossary.md#nvm), [engine-strict](../glossary.md#engine-strict)
