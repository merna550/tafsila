---
packages: []
level: intermediate
adr: ADR-004
---

# Docker (Compose, multi-stage builds, GHCR, hadolint, Trivy)

**In one line:** Packages the web app into one image that runs the same everywhere, and runs local services with Compose.

## What it is (plain words)

A Docker image is a sealed box holding the app and everything it needs. A container is that box running. Compose starts several containers together. A multi-stage Dockerfile builds in a big box and copies only the result into a tiny final box. GHCR is GitHub's image registry. hadolint lints the Dockerfile; Trivy scans the image for known vulnerabilities.

## Why we chose it

- **Build once, run anywhere.** The same image is promoted dev, staging, then production ([ADR-004](../../DECISIONS.md)). Config comes only from runtime environment variables, never baked in.
- **Production-like testing locally:** `docker compose --profile app up` runs the real image against local Supabase.
- **Exit from Vercel:** the image runs on any host.
- **Needed for v2:** the Python simulation service ships as its own image ([python-fastapi-garmentcode](python-fastapi-garmentcode.md)).
- **Clean and safe images:** non-root user, read-only filesystem in Compose, health check on `/api/health`, hadolint and Trivy in CI, plus SBOM and provenance attestations.

## Alternatives we considered (and why not)

- **VMs:** manual setup and patching.
- **Platform-only deploys:** simpler today but locked to one vendor.

## When we would change it

If we leave container hosting entirely for a pure-platform deploy, the CI image build can be dropped. Alpine package versions stay unpinned on purpose ([ADR-007](../../DECISIONS.md)).

## Where it lives in our code

- `apps/web/Dockerfile` (stages `base`, `pruner`, `deps`, `builder`, `runner`), `.dockerignore`, `.env.docker.example`.
- `compose.yaml` (services `inngest`, `web`, `sim`, `newman`).
- `.github/workflows/docker.yml` (hadolint, build, Trivy, smoke test, GHCR push).
- `services/sim/Dockerfile` (v2 template).
- Tutorial: [docker](../../backend/tutorials/docker.md).

## The 20% you need

```dockerfile
# apps/web/Dockerfile
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@^2 prune web --docker
```

- Layer order matters: copy the lockfile and install first so the dependency layer is cached.
- Compose profiles (`app`, `sim`, `tools`) start optional services.

## Commands you'll use

```bash
pnpm docker:build                      # build the web image
docker compose up -d                   # local services
docker compose --profile app up -d --build
```

## Common mistakes

- Baking a secret or an environment URL into the image.
- Pinning `apk` packages (breaks later builds; see [ADR-007](../../DECISIONS.md) and [troubleshooting](../troubleshooting.md#hadolint-dl3018-fails-the-docker-ci-job)).

## Learn more

- [Docker docs](https://docs.docker.com/), [Dockerfile best practices](https://docs.docker.com/build/building/best-practices/), [hadolint](https://github.com/hadolint/hadolint#readme), [Trivy](https://trivy.dev/latest/docs/)
- Glossary: [Docker](../glossary.md#docker), [Docker Compose](../glossary.md#docker-compose), [multi-stage build](../glossary.md#multi-stage-build), [GHCR](../glossary.md#ghcr), [hadolint](../glossary.md#hadolint), [Trivy](../glossary.md#trivy), [SBOM](../glossary.md#sbom)
