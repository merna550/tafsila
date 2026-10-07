---
packages: []
level: beginner
adr: ADR-003
---

# Vercel

**In one line:** Hosts the Next.js app and gives every pull request its own preview website. Docker is the way out if we ever leave.

## What it is (plain words)

Vercel builds the repo on every push and serves it worldwide. A pull request gets a temporary URL (a preview deployment) so Merna can click through the change before it merges; `main` deploys to staging; production is a manual click.

## Why we chose it

- **Zero-config Next.js hosting,** made by the same company. No servers to patch.
- **A preview per PR is the review tool** in [WORKFLOW](../../WORKFLOW.md): Merna reviews a running app, not a diff.
- **Free tier to start,** low effort to operate.
- **Exit path.** The same app builds into a Docker image ([ADR-004](../../DECISIONS.md), [docker](docker.md)), so Vercel is a convenience, not a lock-in.

## Alternatives we considered (and why not)

- **Railway / Fly / Render:** more operations work for similar results.
- **AWS (ECS, Amplify...):** much more operations work and cost control to learn alone.

## When we would change it

**Important, checked on 2026-10-07 at [vercel.com/docs/plans/hobby](https://vercel.com/docs/plans/hobby):** the free Hobby plan is for non-commercial, personal use only. Tafsila charges customers, so **the production project needs the Pro plan (currently $20 per developer seat per month) before the first paying user**; the free tier is fine for development and early previews while there is no revenue. This was not in the original reasoning and is recorded in [ADR-014](../../DECISIONS.md) for Merna's confirmation. If hosting cost or limits become a problem, run the Docker image on another host.

## Where it lives in our code

- Git integration is configured in the Vercel dashboard, not in code.
- `apps/web/next.config.ts` (standalone output), `apps/web/Dockerfile` (the alternative host).
- Environments: [WORKFLOW section 7](../../WORKFLOW.md).

## The 20% you need

- Environment variables are set in the Vercel project per environment (preview, production) and read only through `packages/config/src/env.ts`.
- The preview URL is posted on the PR by the Vercel bot; paste it in the PR description.

## Commands you'll use

None locally; everything is triggered by Git. The CLI (`vercel`) is optional.

## Common mistakes

- Adding an env var locally but not in Vercel (the app refuses to start; see [troubleshooting](../troubleshooting.md)).
- Treating a preview as production: previews use sandbox payments and cheap AI models.

## Learn more

- [Vercel docs](https://vercel.com/docs) (official), [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- Glossary: [Vercel](../glossary.md#vercel), [preview deployment](../glossary.md#preview-deployment)
