# Docker in Tafsila

## Why we use Docker (and why Vercel still deploys the site)

| Use                              | What runs in Docker                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| Local backend                    | Supabase local stack (started by the Supabase CLI), Inngest dev server              |
| Production-like test on your Mac | The real production image of the web app (`--profile app`)                          |
| CI                               | Every PR builds, scans and smoke-tests the image                                    |
| Portability ("exit plan")        | The same image can run on any host (Fly.io, Railway, AWS, a VPS) if we leave Vercel |
| v2 3D simulation                 | `services/sim` (Python) runs only as a container                                    |

Decision record: DECISIONS.md → ADR-004.

## Key ideas (30 seconds)

- **Image** = a sealed package of the app + its runtime. **Container** = a running copy of an image.
- **Build once, promote everywhere:** the image contains no environment-specific values. dev/staging/prod differ only in the env vars given at `docker run` time.
- **Compose** starts several containers together; **profiles** choose which ones.

## Commands

| Task                                     | Command                                                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Start local backend (Supabase + Inngest) | `pnpm dev:all` (runs `supabase start` + `docker compose up -d`)                                                        |
| Build the web image                      | `pnpm docker:build` → `docker build -f apps/web/Dockerfile -t tafsila-web:local .`                                     |
| Run the production image locally         | `cp .env.docker.example .env.docker` (once), then `docker compose --profile app up -d --build` → http://localhost:3001 |
| Logs                                     | `docker compose logs -f web`                                                                                           |
| Shell inside a container                 | `docker compose exec web sh`                                                                                           |
| Run API tests in a container             | `docker compose --profile tools run --rm newman`                                                                       |
| 3D service (v2)                          | `docker compose --profile sim up -d --build`                                                                           |
| Stop everything                          | `docker compose --profile app --profile sim down` and `supabase stop`                                                  |
| Clean disk space                         | `docker system prune` (asks first; removes stopped containers and dangling images)                                     |
| Image size / layers                      | `docker image ls tafsila-web` · `docker history tafsila-web:local`                                                     |

## What makes the images production-grade

- Multi-stage builds; `turbo prune` copies only the packages the web app needs; dependency layer cached by lockfile.
- Next.js `standalone` output: the runtime image has no dev dependencies or source code.
- Runs as a non-root user; read-only filesystem in compose; `no-new-privileges`; CPU/memory limits.
- `HEALTHCHECK` on `/api/health`; OCI labels with version and git SHA (`APP_VERSION`, `GIT_SHA` also exposed at runtime).
- CI: hadolint (Dockerfile lint), Trivy scan (fails on critical CVEs), smoke test, multi-arch build (amd64 for servers, arm64 for your Mac), SBOM + signed provenance, pushed to GitHub Container Registry (`ghcr.io/<owner>/tafsila-web`) with tags `sha-xxxx`, `main`, `staging`, and `vX.Y.Z`.
- Secrets are never baked into images or committed; `.env*` files are excluded by `.dockerignore`.

## Environments with containers

| Env                      | Image tag                             | Config source                     |
| ------------------------ | ------------------------------------- | --------------------------------- |
| local                    | `tafsila-web:local`                   | `.env.docker`                     |
| CI                       | `tafsila-web:ci`                      | `.github/ci.env` (placeholders)   |
| staging (if self-hosted) | `ghcr.io/<owner>/tafsila-web:staging` | host/platform secrets for staging |
| prod (if self-hosted)    | `ghcr.io/<owner>/tafsila-web:vX.Y.Z`  | host/platform secrets for prod    |

## Apple Silicon notes

- Images are built multi-arch, so they run natively on your M-series Mac.
- Give Docker Desktop at least 4 CPUs / 8 GB RAM (Supabase local runs ~10 containers).
- If a port is busy: `lsof -i :3000` and stop the other process, or change the left side of `ports` in `compose.yaml`.

## Troubleshooting

| Symptom                            | Fix                                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| App container can't reach Supabase | Use `host.docker.internal` hosts from `.env.docker.example`; check `supabase status`           |
| Container exits immediately        | `docker compose logs web` — usually a missing env var (env.ts lists which one)                 |
| Build is slow                      | Enable BuildKit cache (default in Docker Desktop); don't change `pnpm-lock.yaml` unnecessarily |
| "no space left on device"          | `docker system prune` and `docker builder prune`                                               |
