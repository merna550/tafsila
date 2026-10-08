# M0 - Foundation & environments

## Goal

Everything needed to build safely: repo, CI/CD, agent workflow, three environments and monitoring, all on free tiers (ADR-022).

## Scope

In: repo and tooling, CI, agent configuration and dispatcher, docs and handbook, local Supabase, staging (Vercel previews + `main`), a production project with a one-click deploy workflow, Sentry and PostHog, agent usage metrics, milestone briefs.
Out: custom domain (moved to M8, ADR-024), any paid plan, product features.

## SRS IDs

NFR (deployability, observability, privacy) in SRS §10 and the delivery plan in SRS §12. No FR IDs.

## Deliverables

- Staging deployed from `main` with the git SHA on `/api/health` (ADR-023).
- Production Supabase and Vercel projects and a manual "Deploy to production" workflow that never runs on its own.
- Errors in Sentry and analytics events in PostHog from web and API.
- Milestone briefs and the `/plan-milestone` and `/plan-wave` commands.

## Exit criteria

Staging deployed from `main`; prod project exists; error and analytics events visible (SRS §12).

## Dependencies

None outside the repo. Staging (#19) is done and is the base for #20 and #21.

## Merna's tasks

- Create the production Supabase and Vercel projects and add their secrets (#20), free tiers only.
- Create the Sentry and PostHog free accounts and add the keys (#21).
- Approve plans and PRs.

## Risks

- Free-tier limits (Supabase pauses after 7 idle days): wake it from the dashboard.
- Telemetry must not send personal data (photos, measurements, phone numbers).

## Issues

| Issue                        | Title                                  | State  |
| ---------------------------- | -------------------------------------- | ------ |
| #3                           | Per-area agent config                  | closed |
| #6                           | MVP milestone plan v2                  | closed |
| #8                           | Handbook core                          | closed |
| #9                           | Tech cards                             | closed |
| #10                          | Handbook upkeep                        | closed |
| #14                          | Docker workflow attest fix             | closed |
| #16                          | Cloud agents                           | closed |
| #17                          | Token-saving setup                     | closed |
| #18                          | Local Supabase                         | closed |
| #19                          | Staging environment                    | closed |
| #20                          | Production project + deploy workflow   | open   |
| #21                          | Sentry + PostHog                       | open   |
| #22                          | Milestone briefs and planning commands | open   |
| #36                          | Agent usage metrics + weekly report    | open   |
| #38, #42, #44, #46, #48, #50 | Dispatcher fixes                       | closed |
