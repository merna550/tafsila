# Decision log

Newest first. Each entry: date · decision · reason · alternatives considered. Agents read this before asking questions.

## ADR-010 · 2026-10-07 · Handbook: link to the docs, never duplicate them

**Decision:** `docs/handbook/` explains terms, technologies and patterns in plain English and links to SRS, ARCHITECTURE, CODING_STANDARDS, DECISIONS and WORKFLOW, which stay the source of truth. Things that are designed but not built yet are marked "planned" with the SRS or ADR reference. Glossary entries name a technology card as plain text until that card exists (issue #9), so no link in the handbook points to a missing file.
**Reason:** One source of truth per fact; the handbook cannot drift into a second, conflicting spec; every relative link can be checked.
**Alternatives:** Copy rules into the handbook (drifts); wait for tech cards before writing the glossary (blocks the core pages).

## ADR-009 · 2026-10-07 · MVP milestone plan v2; 3D deferred to post-launch

**Decision:** Delivery is planned in 10 milestones, `M0 - Foundation & environments` … `M9 - Public launch`, plus `Post-launch` (SRS §12, WORKFLOW §8; titles identical to GitHub). The simplified 3D assembly preview (FR-3D-01…04, priority "Should") moves to `Post-launch`; the engine still outputs the sewing order (FR-PAT-06). Acceptance-criteria progress is tracked by ticking the issue checkboxes with `scripts/gh-ac.sh`.
**Reason:** Smaller milestones with checkable exit criteria; accounts/data and the manual design UI come before AI so the product is usable early; 3D is not needed to launch and was the largest risk in the old M5. Ticked criteria make progress visible on the issue and the board.
**Alternatives:** Keep the 7-milestone plan (milestones too large, 3D on the critical path); track progress only by open/closed issues (no view inside an issue).

## ADR-008 · 2026-10-07 · Per-area agent configuration

**Decision:** Agent instructions are split by area: root `CLAUDE.md` for project-wide rules, nested `CLAUDE.md` in `apps/web`, `packages/api` and `packages/engine` (loaded only when those files are touched), path-scoped rules in `.claude/rules/**` (`paths:` frontmatter), and task skills in `.claude/skills/` that link to the existing tutorials instead of repeating them.
**Reason:** Agents load only the rules for the files they edit (fewer tokens, less noise), and common tasks follow one fixed procedure that ends with the Definition of Done.
**Alternatives:** One large root `CLAUDE.md` (loaded every session, grows without bound); slash commands only (no automatic loading by path).

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
