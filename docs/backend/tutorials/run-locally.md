# Run Tafsila locally

## Isolated environment (why your other projects are not affected)

| Layer               | How it is isolated                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Node.js             | Version pinned in `.nvmrc`; `nvm use` switches only the current terminal. Other projects keep their own versions. |
| pnpm                | Version pinned in `package.json` → `packageManager`; Corepack runs exactly that version inside this project.      |
| npm packages        | Installed in this folder's `node_modules` (pnpm content-addressed store, no global packages).                     |
| Python (v2 only)    | `services/sim` gets its own `.venv` via `uv` with the version in `.python-version`.                               |
| Database & services | Supabase, Inngest and the app image run in Docker containers.                                                     |

Tip: add automatic `nvm use` on `cd` to `~/.zshrc` (see nvm docs: "deeper shell integration").

## First time

```bash
bash scripts/bootstrap.sh
```

It installs the pinned Node (if missing), activates the pinned pnpm, installs dependencies, creates `.env.local`, creates the git repository with the first commit, installs the pre-commit hook, checks Docker / Supabase CLI / gh, and runs all checks.

## Daily

```bash
nvm use
pnpm dev                 # app only, http://localhost:3000
pnpm dev:all             # + Supabase local + Inngest (needs Docker running)
pnpm test                # unit + property tests
pnpm quality             # format, lint, typecheck, duplication, architecture
```

- Supabase Studio: http://127.0.0.1:54323 · API health: http://localhost:3000/api/health
- Reset database: `pnpm db:reset` · Stop services: `pnpm dev:stop`
