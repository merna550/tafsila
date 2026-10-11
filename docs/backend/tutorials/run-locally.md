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

- **What happens automatically (issue #95).** `pnpm dev` first runs `scripts/check-deps.mjs`: if `node_modules` does not match `pnpm-lock.yaml` it runs `pnpm install --frozen-lockfile` before Next.js starts, and if `.env.local` is missing or `SUPABASE_URL`, `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` is empty or still a `<from supabase status>` placeholder it stops with one message naming the keys (never the values). Git hooks run `scripts/sync-deps.sh` after pull, rebase and branch switch with the same install. Nothing runs when `CI=true`. Manual fallback: `pnpm install`.
- One env file: the web app reads the repo-root `.env.local` (no symlink in `apps/web/` needed); a value in `apps/web/.env.local` still wins ([ADR-95](../../decisions/95-local-dev-auto-sync.md)).
- Supabase Studio: http://127.0.0.1:54323 · API health: http://localhost:3000/api/health
- Reset database: `pnpm db:reset` · Stop services: `pnpm dev:stop`

## Local Supabase (no accounts, no cost)

```bash
pnpm db:start     # Postgres, Auth, Storage, Studio, mail catcher (needs Docker)
pnpm db:reset     # re-apply all migrations + supabase/seed.sql on a clean database
pnpm db:types     # regenerate packages/api/src/adapters/supabase/database.types.ts
pnpm db:stop
```

`pnpm exec supabase status` prints the anon and service-role keys for `.env.local` (see `.env.example`).

| Service            | URL                                                       |
| ------------------ | --------------------------------------------------------- |
| API (Auth/Storage) | http://127.0.0.1:54321                                    |
| Studio             | http://127.0.0.1:54323                                    |
| Mail catcher       | http://127.0.0.1:54324 (every email lands here)           |
| Postgres           | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

- **Test phone numbers** (no SMS is ever sent locally): `+201000000001`, `+201000000002`, `+201000000003`, each with the code `123456`.
- Email sign-up needs confirmation: open the mail catcher and click the link.
- Google sign-in is declared in `supabase/config.toml` but disabled locally; enable it per environment with `SUPABASE_AUTH_EXTERNAL_GOOGLE_*`.
- The private storage bucket `design-photos` is created by `supabase/config.toml` (used from M6).
- The app starts without the AI and Paymob variables; they are required only when `APP_ENV=production`.
- Reset everything: `pnpm db:stop && pnpm db:start && pnpm db:reset`.
