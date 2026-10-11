# Plan #25: Sign up / sign in with email + Google, password reset, sign out (Arabic RTL)

Issue: #25 · plan:sonnet · build:sonnet · Milestone: M1 - Accounts & data · size:L (was M) · Wave 2 · FR-AUTH-01, FR-AUTH-04 (reset, sign out), NFR-04, NFR-06

Depends on #24 (closed). Blocks #26, #27 and, through the i18n part, every M1 screen (#30, #31, #32).

## Why the size goes from M to L, and the split

#25 is the first real screen, so it also has to bring in tools that are not in the repo yet: next-intl with `[locale]` routes and `messages/` (ADR-029 (6) and ADR-72 waited for this), React Hook Form, `@supabase/ssr`, and a Playwright e2e setup for `apps/web` plus its CI job. All of that does not fit one 50-turn run (ADR-032). Split into three issues, built in order, each one PR (approved by Merna on 2026-10-11):

| Part | Issue                                                | What                                                                                                   | Size |
| ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---- |
| A    | #90 `feat(web): i18n foundation and web e2e harness` | next-intl, `app/[locale]/`, `messages/{ar,en}.json`, error texts moved, Playwright for `apps/web` + CI | M    |
| B    | #91 `feat(auth): session, route guard and API auth`  | `@supabase/ssr` in `shared/auth`, `proxy.ts`, `(dashboard)` guard, Hono auth middleware, role claim    | M    |
| C    | #25 (kept, renamed scope)                            | the four screens, sign-out, Google, confirm route, email templates, analytics, e2e flow, staging       | M    |

B depends on A; C depends on B. #26 and #27 then depend on C (#25) as today. If Merna prefers one issue, the build uses "Part of #25" PRs with the same three groups and the checkpoint rule (ADR-032).

## Approach

The browser talks to Supabase Auth directly for sign-up, sign-in, reset and Google (supabase-js in `shared/auth` only, ADR-029). The session lives in cookies through `@supabase/ssr`; `proxy.ts` (Next 16's name for middleware) refreshes it on every request, applies the locale, and sends signed-out visitors away from `(dashboard)` routes. Our API never sees a password: its auth middleware verifies the Supabase access token (`jose` against the project JWKS, as ADR-035 does) and puts `{ userId, role }` in the Hono context. The role travels inside the token (custom access token hook), so no database query is needed per request.

## Files to create or change

### Part A: i18n foundation and web e2e harness

- `apps/web/package.json`: add `next-intl`; devDependency `@playwright/test` (same version as `packages/ui`); scripts `test:e2e`, `test:e2e:update`.
- `apps/web/src/shared/i18n/routing.ts` (`defineRouting`: locales `ar`, `en`; default `ar`; `localePrefix: "as-needed"`), `request.ts` (`getRequestConfig`), `navigation.ts` (`Link`, `redirect`, `useRouter` from `createNavigation`), `index.ts`.
- `apps/web/src/proxy.ts`: next-intl middleware only in part A (part B adds the session).
- `apps/web/messages/ar.json`, `en.json`: home page, error display texts (moved from `shared/error-display/messages.ts`, which is deleted), `common` (app name, language switch).
- `apps/web/src/app/[locale]/layout.tsx` (sets `lang` and `dir` from the locale, `NextIntlClientProvider`, `generateStaticParams`), `apps/web/src/app/[locale]/page.tsx` (home moved here, texts from messages); root `app/layout.tsx` keeps fonts and observability only; `app/page.tsx` deleted.
- `apps/web/src/shared/error-display/*`: read texts through `useTranslations("errors")`; tests updated.
- `apps/web/src/features/home/`: texts from messages; a small `LocaleSwitch` component in `shared/i18n`.
- ESLint: remove the home-page exemption from the literal-text rule (ADR-029 (6)).
- `apps/web/playwright.config.ts` (projects `ar` and `en`, mobile and desktop widths, `webServer` = `next start` after `next build`), `apps/web/e2e/home.spec.ts` (home renders in `ar` RTL and `en` LTR).
- `.github/workflows/e2e.yml`: on PRs touching `apps/web/**`, `packages/ui/**`, `packages/api/**`, `packages/config/**`, `supabase/**`, and on `main`; starts local Supabase with the mail catcher (part C needs it), builds, runs `pnpm --filter web test:e2e`, uploads the report on failure. Path-gated like the Storybook job (ADR-86).
- Docs: `docs/frontend/README.md` (i18n how-to), tech card `next-intl.md` (`packages:`), `playwright.md` (add `apps/web`), `docs/test-cases/ui/25a-i18n.md`.

### Part B: session, route guard and API auth

- `apps/web/package.json`: add `@supabase/ssr`, `@supabase/supabase-js`.
- `packages/config/src/env.ts`: `PublicConfig` gains `supabaseUrl`, `supabaseAnonKey` (public by design) and `authGoogleEnabled` (`AUTH_GOOGLE_ENABLED`, default false); `.env.example`, `.env.docker.example`, `.github/ci.env` updated; tests.
- `apps/web/src/shared/auth/`: `browser-client.ts` (created from `PublicConfig` passed by the layout, no `NEXT_PUBLIC_*`, ADR-025), `server-client.ts` (cookies), `session.ts` (`getSessionUser()` for Server Components), `update-session.ts` (used by `proxy.ts`), `auth-actions.ts` (signUp, signIn, signInWithGoogle, requestReset, updatePassword, signOut; each returns a result or a mapped `ApiError`), `map-auth-error.ts`, `index.ts`. Unit tests with a fake client.
- `apps/web/src/proxy.ts`: compose next-intl + `updateSession`; matcher excludes `/api`, static files and `_next`. Guard: a path inside `(dashboard)` without a user redirects to `/sign-in?next=<path>` (same-site only, the rule of ADR-72); a signed-in user on `/sign-in` or `/sign-up` goes to `/dashboard`.
- `apps/web/src/app/[locale]/(dashboard)/layout.tsx` (server-side check as a second line behind the proxy) and `dashboard/page.tsx` (placeholder: "welcome" + sign-out; the real dashboard comes later).
- `supabase/migrations/<ts>_custom_access_token_hook.sql`: `public.custom_access_token_hook(event jsonb)` adds `user_role` from `profiles.role` (default `user`); grants only to `supabase_auth_admin`; pgTAP test in `supabase/tests/database/`. `supabase/config.toml`: `[auth.hook.custom_access_token]` enabled with `uri = "pg-functions://postgres/public/custom_access_token_hook"`.
- `packages/api/src/middleware/auth.ts`: `requireAuth()` reads `Authorization: Bearer`, verifies with `jose` `createRemoteJWKSet(<SUPABASE_URL>/auth/v1/.well-known/jwks.json)` (issuer and audience `authenticated` checked), sets `c.set("auth", { userId, role, claims })`; missing or invalid → `AppError("UNAUTHENTICATED")`; `requireRole("admin")` → `FORBIDDEN`. JWKS fetcher is a port so tests use a local key pair. `packages/api/src/routes/me.ts`: `GET /api/me` returns `{ userId, role }`, the first protected route (used by the e2e test and by #27 later). OpenAPI + Postman updated (`pnpm api:openapi && pnpm api:postman`).
- `apps/web/src/shared/api/client.ts`: attach the access token from `shared/auth` (getter injected, so `shared/api` does not import Supabase).
- Dependency-cruiser: allow `jose` only in `packages/api/src/middleware/auth.ts` and the adapter, same style as ADR-035.
- Docs: `docs/backend/README.md` (auth middleware), `docs/errors.md`, tutorial `docs/backend/tutorials/add-endpoint.md` (protect a route with `requireAuth()`), `docs/test-cases/auth/25b-session-and-api-auth.md`.

### Part C: screens and flows (#25)

- `apps/web/package.json`: add `react-hook-form`, `@hookform/resolvers`.
- `apps/web/src/features/auth/`: `model/auth.schema.ts` (Zod: email, password ≥ 8, confirm match; messages are message keys), `hooks/use-sign-up.ts`, `use-sign-in.ts`, `use-forgot-password.ts`, `use-reset-password.ts`, `use-sign-out.ts` (React Hook Form + `shared/auth` actions + `useApiErrorHandler`), `components/SignUpForm.tsx`, `SignInForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`, `GoogleButton.tsx`, `SignOutButton.tsx`, `CheckEmailNotice.tsx`, `index.ts`. Built only from `packages/ui` (`FormField`, `Input`, `Button`, `Card`, `Link`, `Toast`).
- Routes: `app/[locale]/(auth)/sign-up/page.tsx`, `sign-in/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx`, `(auth)/layout.tsx` (centred card, language switch); `app/auth/confirm/route.ts` (`verifyOtp({ token_hash, type })` → signup: `/dashboard?welcome=1`; recovery: `/reset-password`; failure: `/sign-in?error=link`), `app/auth/callback/route.ts` (Google: `exchangeCodeForSession`).
- `messages/{ar,en}.json`: `auth.*` keys (Arabic first; Merna reviews the wording).
- `supabase/templates/confirmation.html`, `recovery.html` (Arabic first, English below, RTL, link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=…`); `config.toml`: templates, `minimum_password_length = 8`, `site_url` and `additional_redirect_urls` for `/auth/*`, local `email_sent` rate limit raised for e2e reruns (local only).
- `.github/workflows/staging.yml`: the appended `[remotes.staging]` block also sets `site_url`, redirect URLs, Google `enabled = true` with `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` / `_SECRET` secrets, and the auth rate limits; `AUTH_GOOGLE_ENABLED=true` in the Vercel staging env (tutorial step).
- `packages/schemas/src/analytics-events.ts`: `signup_started` gains `source: "sign_up_page"` and `method: "email" | "google"`; new `signup_completed` with `method`. Fired: started on first form submit, completed when `/dashboard?welcome=1` loads once. No PII (schema test).
- `packages/api/src/domain/errors.ts` + `docs/errors.md`: `AUTH_INVALID_CREDENTIALS`, `AUTH_EMAIL_NOT_CONFIRMED`, `AUTH_EMAIL_TAKEN`, `AUTH_WEAK_PASSWORD`, `AUTH_LINK_INVALID` (bilingual; `errors.test.ts` keeps them complete). Supabase errors are mapped by `error.code` in `map-auth-error.ts`; rate-limit errors map to the existing `RATE_LIMITED`. Note: "email taken" is shown only as a generic "check your email" to avoid account enumeration when confirmations are on (Supabase returns a fake user); the code exists for the Google-linked case.
- `apps/web/e2e/auth.spec.ts`: sign up → read the confirmation mail from the local mail catcher API → open the link → dashboard → sign out → sign in → forgot password → mail → reset → sign in with the new password; protected page redirects when signed out; `GET /api/me` 401 without a token. Runs in `ar`; one smoke run in `en`.
- Tutorial `docs/backend/tutorials/google-oauth.md`: Merna's Google Cloud steps (OAuth client, consent screen in testing mode, redirect URI `https://<staging-ref>.supabase.co/auth/v1/callback`, the two secrets, `AUTH_GOOGLE_ENABLED`).
- Docs: `docs/test-cases/auth/25-auth.md`, SRS FR-AUTH-01/04 status, `docs/decisions/25-auth.md` (decisions below), handbook (glossary: OAuth, JWT/JWKS, access token hook, session cookie; tech cards `supabase.md`, `react-hook-form.md` new, `next-intl.md`), learning log, `seed-data.md` (seed users sign in with their password; confirmed already).

## Data, schema and API contract

- Migration (part B): one function + hook config; no table change. `profiles` rows are created by the #24 trigger on `auth.users` insert, so sign-up needs no extra code.
- New endpoint `GET /api/me` → `200 { userId, role }`, `401 UNAUTHENTICATED`. Error body as ADR-030.
- New error codes listed above.

## Test plan

- **Unit (Vitest):** `auth.schema` (valid, short password, mismatch, Arabic-Indic digits in email rejected as invalid email), `map-auth-error` (each Supabase code → our code, unknown → `INTERNAL_ERROR`), `next` redirect sanitiser (`/dashboard` ok; `//evil.com`, `https://evil.com`, `/\evil` rejected), proxy guard decision function (pure: path + user → allow / redirect), API `requireAuth` (no header, malformed, wrong issuer, expired, wrong key, valid → context set), `requireRole`, `GET /api/me`, i18n message parity test (every key in `ar.json` exists in `en.json` and the reverse), analytics schema (`signup_completed` rejects email-shaped values).
- **pgTAP:** hook adds `user_role` from `profiles.role`; defaults to `user`; `authenticated` cannot execute the hook.
- **E2E (Playwright, CI with local Supabase):** the flow above; home in `ar`/`en`; mobile 390 px and desktop 1280 px.
- **Visual:** screenshots of the four screens in `ar` and `en` at mobile width attached to the PR (no new snapshot suite; `packages/ui` already snapshots the components).
- **Manual test cases (draft):** TC-AUTH-25-01 sign up with email (ar) · 02 confirmation link signs in · 03 sign in wrong password shows Arabic error under the form · 04 unconfirmed email message · 05 forgot + reset · 06 expired/used reset link · 07 sign out clears session (back button does not show dashboard) · 08 protected page redirects and returns to `next` · 09 Google sign-in on staging · 10 English mode LTR · 11 mobile width · 12 too many attempts shows `RATE_LIMITED` text · 13 API `GET /api/me` without token → 401 body · 14 API with another project's token → 401.

## Decisions (the build writes them in `docs/decisions/25-auth.md`)

1. **Split into three issues** A (#90) → B (#91) → C (#25). Approved by Merna.
2. **URLs:** Arabic default without prefix (`/sign-in`), English with `/en/…` (`localePrefix: "as-needed"`), so the ADR-72 redirect `/sign-in?next=` keeps working. Locale remembered in the next-intl cookie; #27 later stores it in `profiles.locale`.
3. **Browser Supabase config at runtime** through `PublicConfig` (URL + anon key are public), never `NEXT_PUBLIC_*` (ADR-025).
4. **Role in the token** via the custom access token hook (`user_role` claim from `profiles.role`); a role change takes effect at the next token refresh (≤ 1 hour). The API verifies tokens once in `requireAuth`; #29's `withUser` reuses the verified claims instead of verifying again.
5. **Rate limiting (NFR-04):** auth requests go from the browser to Supabase Auth, so GoTrue's built-in limits are the auth limiter (values set for local and staging in config); no limiter in Hono for this issue because our API has no auth endpoint. A Hono limiter comes with the first AI or checkout endpoint.
6. **Email links** use `token_hash` to `/auth/confirm` (works when the link is opened on another device, unlike the PKCE code); Arabic-first templates in `supabase/templates/`.
7. **Password policy:** at least 8 characters, no other rules (NIST-style; long passphrases allowed). Approved by Merna.
8. **Google:** off locally unless a developer enables it; on for staging with secrets; the button shows only when `AUTH_GOOGLE_ENABLED=true`.
9. **No account enumeration:** sign-up with an existing email shows the same "check your email" notice.
10. **Staging email:** Supabase's built-in sender only delivers to the project's team members, about 2 emails per hour. Staging is tested with Merna's own address; a custom SMTP sender (a free tier, for example Resend) is needed before the beta and is noted for M8. **Merna to know.**

## Docs to update

Listed per part above; plus `CLAUDE.md` status "Next" line when C is merged, `docs/milestones/M1-accounts-and-data.md` issue table (A and B rows), `docs/CONTEXT_MAP.md` "New screen" row gains `shared/i18n` and `shared/auth`.

## Risks and how they are handled

- **Next 16 + next-intl + `@supabase/ssr` in one `proxy.ts`:** cookie writes from both must survive; the proxy builds one response and copies Supabase's cookies onto next-intl's response (pattern from the Supabase SSR guide); an e2e test checks that the session survives a page reload in both locales.
- **CI time:** the e2e job starts Supabase (~1 min) and builds Next (~2 min); path-gated so docs-only PRs skip it (ADR-86).
- **Hook not pushed to staging:** `supabase config push` must include `[auth.hook.custom_access_token]`; part B adds a staging smoke check: `GET /api/me` with a seeded staging test user returns `role`.
- **Email limits break e2e reruns locally:** local `email_sent` raised; CI starts a fresh Supabase each run.
- **Moving texts to next-intl touches error display (ADR-72) and home:** part A is a pure move with the existing tests kept green; no behaviour change.
- **Arabic copy quality:** Merna reviews `messages/ar.json` in the C PR.

## Merna does

- Approve the split (decision 1) and the password minimum (decision 7).
- Google Cloud OAuth client for staging (tutorial in part C), then the two GitHub secrets and `AUTH_GOOGLE_ENABLED=true` in Vercel.
- Review the Arabic texts and the email templates in the C PR.

## Labels

`size:M` → `size:L` (whole issue); each split issue `size:M`, `plan:sonnet`, `build:sonnet`, `area:ui` and/or `area:api`. Not `needs:interactive` (`scripts/needs-interactive.mjs`: no). Status stays `status:plan-review` until Merna approves.
