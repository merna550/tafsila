# Plan #9: Technology cards

Issue: #9 · plan:none · build:sonnet · Milestone: M0 - Foundation & environments · Stacked on #8 (PR #11)

The issue body is the plan (`plan:none`). What was done:

1. **33 cards** in `docs/handbook/tech/`, from `_TEMPLATE.md`: one for every row of the issue, with the grouped rows split (`tanstack-query` and `zustand`, `vitest` and `fast-check`), plus `next-intl` and `drizzle` because the glossary and SRS 3.1 already name them.
2. **Reasoning:** the "Why" of the issue is kept and expanded for Tafsila (Egypt, Arabic RTL, solo founder, engine in the browser). Unbuilt technologies are marked "planned" and list no non-existent path in "Where it lives".
3. **Dependency coverage:** every direct dependency in every `package.json` (except `@tafsila/*`, `@types/*`) is in some card's `packages:` front matter (24 packages, verified with a script).
4. **Fact check (2026-10-07):** Node release status, Vercel Hobby terms, Stripe in Egypt, Supabase / Inngest / Sentry / PostHog free tiers, FreeSewing licence, Paymob methods. Corrections are listed in the PR and in ADR-014.
5. **ADRs:** ADR-011 frontend stack, ADR-012 jobs / payments / data access, ADR-013 tooling and quality gates, ADR-014 Vercel Pro and Node pin.
6. **Glossary:** every `Card:` is now a link; new entries `exit-path`, `lock-in`, `tech-card`.
7. **Docs touched:** `tech/README.md` index, `docs/DECISIONS.md`, `docs/handbook/learning-log.md`, `CLAUDE.md` status, this plan, `docs/test-cases/docs/9-tech-cards.md`.

## Verification

- All relative links and anchors in `docs/` resolve; every backticked path in "Where it lives" exists (script in the session scratchpad).
- `pnpm quality && pnpm test` green.
