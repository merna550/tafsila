# Switch environment (dev → staging → prod)

| What     | dev                   | staging                                         | prod                                          |
| -------- | --------------------- | ----------------------------------------------- | --------------------------------------------- |
| App      | `pnpm dev`            | merge to `main`                                 | GitHub Actions → "Deploy to production"       |
| Env vars | `.env.local`          | Vercel "Preview/Staging" + GitHub env `staging` | Vercel "Production" + GitHub env `production` |
| DB       | Supabase local        | Supabase staging project                        | Supabase prod project                         |
| Postman  | env "Tafsila — local" | "Tafsila — staging"                             | "Tafsila — prod" (read-only smoke tests)      |

- All variables are declared once in `packages/config/env.ts` (Zod) and listed in `.env.example`; the app refuses to start if one is missing.
- Point local tools at staging: `pnpm env:pull staging` (writes `.env.staging.local` from Vercel), then `pnpm dev --env staging`.
- Feature flags (PostHog) turn features on per environment without a deploy.
- Rollback: Vercel → previous deployment → "Promote"; DB migrations are written to be backward compatible for one release.
