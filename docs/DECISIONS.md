# Decision log

Newest first. Each entry: date · decision · reason · alternatives considered. Agents read this before asking questions.

## ADR-007 · 2026-10-07 · Do not pin Alpine apk package versions

**Decision:** `apk add` in Dockerfiles stays unpinned (hadolint DL3018 ignored on its own line); reproducibility comes from the pinned base image tag.
**Reason:** Alpine removes old package versions from its mirrors, so pinned versions break future builds.
**Alternatives:** Pin apk versions (builds break when mirrors drop them); Debian-slim base (bigger image).

## ADR-006 · 2026-10-07 · Architecture style per part

**Decision:** Modular monolith. Frontend: feature-sliced. API: hexagonal (ports & adapters) with a composition root. Engine: functional core with a plugin pipeline of feature modules. See docs/ARCHITECTURE.md.
**Reason:** Clear boundaries for a solo developer, vendor independence, deterministic and testable geometry, new garment features without touching existing ones.

## ADR-005 · 2026-10-07 · One monorepo; backend as a Hono package

**Decision:** Single repo. API lives in `packages/api` (Hono), mounted in Next.js at `/api`; can run standalone as `apps/api` later with no rewrite.
**Reason:** Shared engine and schemas, one PR per feature, one CI; backend stays independently deployable.
**Alternatives:** Separate frontend/backend repos (duplication, sync overhead); API inside Next.js route handlers (harder to extract later).

## ADR-004 · 2026-10-06 · Docker images for portability and production-like testing

**Decision:** Build a production-grade Docker image of the web app in CI (multi-arch, scanned, pushed to GHCR) and use Docker Compose for local services; Vercel remains the primary host.
**Reason:** One immutable image promoted across environments; prod-like local testing; exit plan from Vercel; required for the v2 Python simulation service.
**Alternatives:** Vercel-only (no portability); self-host from day one (more ops work for a solo founder).

## ADR-003 · 2026-10-06 · Managed services: Vercel + Supabase

**Decision:** Host on Vercel; Supabase for Postgres, Auth, Storage. External services behind adapters.
**Reason:** Free tiers, minimal ops, Postgres is portable.

## ADR-002 · 2026-10-06 · AI understands, engine draws

**Decision:** AI only produces/edits a validated DesignSpec; a deterministic TypeScript engine produces all geometry.
**Reason:** Millimetre accuracy, reproducibility, testability.

## ADR-001 · 2026-10-06 · TypeScript monorepo

**Decision:** TypeScript for web, API and engine (pnpm + Turborepo); Python only for the v2 simulation service.
**Reason:** One language for a solo developer; engine must run in the browser; FreeSewing is JavaScript.
