# Plan #27: Settings (language, units) and delete account with all personal data

Issue: #27 · plan:sonnet · build:sonnet · size:S → **size:M** (two PRs) · Milestone: M1 - Accounts & data · FR-AUTH-04, FR-AUTH-05, NFR-05 (Egypt Law 151/2020) · Design: `Settings.dc.html`

Depends on #25 (merged). It also relies on #26 part A (merged, PR #113): `trial_phones` (`user_id … on delete set null`) and `GET /api/phone` already exist, which is what keeps the hashed trial phone after deletion; nothing from #26 part B is needed. Best built after #30 merges (it adds the navigation bar this issue adds an item to), but part A (API and database) does not depend on #30 at all and can start now.

## Why the size goes from S to M, and the split

The issue looks like one screen, but it needs a profile endpoint, an irreversible server-side use case that talks to four systems (GoTrue admin, Storage, PostHog, the audit table), a database function and a settings screen. One issue, two PRs ("Part of #27"), each with the checkpoint rule:

| Part | What                                                                                                                                      | Size |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| A    | `GET`/`PATCH /api/profile`, `DELETE /api/account`, ports and adapters, audit function + pgTAP, error codes, config, Postman, tutorial     | M    |
| B    | `/settings` screen (name, phone row, language, units, delete dialog), nav item, guard, language persistence, e2e, test cases, screenshots | M    |

## Approach

**Part A: the API owns the deletion.** `DELETE /api/account {confirm: "DELETE_MY_ACCOUNT"}` runs one use case, `services/delete-account.ts`, in this order (the irreversible step is last, so a failure before it leaves the account intact and every step is safe to repeat):

1. Refuse accounts with `role = admin` (`ACCOUNT_DELETE_FORBIDDEN`, 403); an admin demotes the account by SQL first (documented).
2. `UserFilesRemover.removeAll(userId)`: lists and removes every object under `<userId>/` in each bucket of a registry (`STORAGE_BUCKETS = ["design-photos"]` in `domain/storage-buckets.ts`; a test fails if `supabase/config.toml` declares a bucket that is not in the registry, so M6 cannot forget it).
3. `IdentityEraser.erase(userId)`: asks PostHog to delete the person whose distinct id is the user id (events only ever carry the opaque id, never PII).
4. `AccountDeleter.deleteUser(userId)`: GoTrue admin `DELETE /auth/v1/admin/users/{id}` with the service role key. The database does the rest through existing foreign keys: `profiles`, `clients`, `measurement_sets`, `phone_otp_events`, user-owned `size_charts` cascade; `trial_phones.user_id` becomes null (the hash stays, so the same number never gets a second trial); `admin_audit.who` becomes null. A 404 from GoTrue counts as success (repeat after a half-finished run).
5. `AccountAudit.recordDeleted()`: one `admin_audit` row `{ action: "account.deleted" }` with **no user id, no email, no name**, through a new `private.record_account_deleted()` function (the table only lets admins insert, and the user is gone by now). If this last write fails, the error goes to Sentry and the request still returns `204`: the account is already deleted and the person must not see a failure.

`GET /api/profile` returns `{ name, locale, email }` (email from the verified token claims, name and locale from `profiles`); `PATCH /api/profile {name?, locale?}` updates through `withUser`, which the column grants of ADR-24a already allow (`authenticated` may update only `name` and `locale`). The phone row of the screen uses the existing `GET /api/phone`.

**Part B: the screen** (feature `apps/web/src/features/settings/`, thin page `app/[locale]/(dashboard)/settings/page.tsx`), three cards as in the design:

- **Account:** name field with an explicit "حفظ" button (enabled when changed), phone row read-only (`+20 10 1234 5678`, always LTR, "مؤكَّد" tick; when not verified: "غير مؤكَّد" with a link to `/verify-phone`, shown only when that route exists).
- **Display:** language as two toggle buttons (`aria-pressed`), units shown as text "سنتيمتر" with "وحدة الإنش قريباً."; switching language navigates to the same page in the other language (`router.replace(pathname, { locale })`) and saves `locale` to the profile in the background.
- **Delete account:** danger card, "حذف حسابي" opens a `Dialog` that lists what is removed, asks to type the word ("حذف" in Arabic, "DELETE" in English), enables the confirm button only on an exact match, calls the API, then signs out locally and opens `/` with a notice "تم حذف حسابك".
- A "تسجيل الخروج" link at the bottom (reuses `SignOut` from `features/auth`).

## Decisions (the build writes them in `docs/decisions/27-settings-delete-account.md`)

1. **Deletion order: files, analytics, auth user, audit; audit failure never fails the request.** Recommended over deleting the auth user first (a failed file cleanup would then leave orphan personal files that nobody can find, because the owner id is gone) and over one big database transaction (GoTrue, Storage and PostHog are not in the database). **Security-sensitive, Merna to know.**
2. **Confirmation: typed word in the UI plus a fixed `confirm` literal in the API body.** The literal is language independent (`DELETE_MY_ACCOUNT`), so a mistaken or scripted call without it is a `400`. No extra "sign in again" step: the token is already proof of the session (a token is valid up to one hour). Cheap to add later with a "recent sign-in" check. **Merna to accept.**
3. **Admins cannot delete themselves through the app** (`ACCOUNT_DELETE_FORBIDDEN`), so the project can never lose its last admin by a click. Documented SQL path in `docs/backend/`.
4. **Name is saved with a button, not on blur.** The design shows no button; an explicit button is predictable for screen readers and mobile keyboards. Cheap to change.
5. **Language switch is instant; saving to the profile is best effort.** The URL and the `NEXT_LOCALE` cookie make it "remembered" on this device; `profiles.locale` is for emails (M8) and a future "use my language on a new device" step, which is **not** built now. A failed save shows a toast and does not undo the switch.
6. **PostHog erasure needs a private key.** `IdentityEraser` calls PostHog's person-delete API with `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` (both optional env vars). Without them a no-op eraser logs one warning and continues, so local, CI and staging work without PostHog; the missing key does not block the feature. Production must have the key before the beta (checklist item for M8 and the release check). **Merna does:** create the key when she wants real erasure (no payment needed, PostHog free tier).
7. **Storage registry:** removal goes through a bucket list in code that a test keeps equal to `config.toml`. A bucket added without registering it fails CI.
8. **Units:** cm only, shown as text; no setting is stored. When inches arrive, a column is added then (not a placeholder column now).
9. **No new profile fields** (name and locale only); email and phone are read-only here. Changing email or phone is not in FR-AUTH-04/05.

## Files to create or change

### Part A: database, API, config

- `supabase/migrations/<ts>_account_deletion.sql`: `private.record_account_deleted()` (`security definer`, `set search_path = ''`, `revoke all from public`, `grant execute to api_app, service_role`): inserts into `admin_audit` `(who null, action 'account.deleted')`. Nothing else changes (no new tables).
- `supabase/tests/database/account-deletion.test.sql` (pgTAP, matrix below).
- `packages/schemas/src/profile.ts` (+ test, export): `profileSchema { name: string | null, locale: "ar" | "en", email: string | null }`, `updateProfileInputSchema` (name trimmed 1 to 120 or null; locale; at least one field), `deleteAccountInputSchema { confirm: z.literal("DELETE_MY_ACCOUNT") }`; `.meta({ example })` on all.
- `packages/schemas/src/analytics-events.ts` (+ test): `account_deleted` (no properties) and `locale_changed { locale }`, `.strict()`.
- Ports: `ports/profile-repository.ts` (`get(auth)`, `update(auth, patch)`), `ports/account-deleter.ts`, `ports/user-files-remover.ts`, `ports/identity-eraser.ts`, `ports/account-audit.ts`.
- Adapters: `adapters/supabase/profile-repository.ts` (Drizzle through `withUser`), `adapters/supabase/gotrue-account-deleter.ts` (fetch with the service role key; 404 → success; other failures → `INTERNAL_ERROR` with the provider message only in Sentry), `adapters/supabase/storage-files-remover.ts` (Storage REST list + bulk remove, paged), `adapters/posthog/posthog-identity-eraser.ts` and `adapters/noop/noop-identity-eraser.ts`, `adapters/supabase/account-audit.ts` (through `withApiRole`), memory fakes for all five in `adapters/memory/`; `rejecting-repositories.ts` covers the profile repository when `DATABASE_URL` is missing.
- Services (+ tests with memory adapters): `services/get-profile.ts`, `update-profile.ts`, `delete-account.ts`.
- Routes: `routes/profile.ts` (`GET /api/profile`, `PATCH /api/profile`), `routes/account.ts` (`DELETE /api/account` → 204), all behind `requireAuth`; `app.ts`, `container.ts`, `openapi/document.ts`; `pnpm api:openapi && pnpm api:postman`.
- `packages/api/src/domain/errors.ts` + `docs/errors.md`: `ACCOUNT_DELETE_FORBIDDEN` (403) — Arabic "لا يمكن حذف حساب المشرف من التطبيق" / English "An admin account cannot be deleted from the app". No other new code (a wrong `confirm` is `VALIDATION_FAILED`).
- `packages/config/src/env.ts` (+ test): `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID` optional, both or neither; `.env.example`, `.env.docker.example`.
- `packages/api/src/domain/storage-buckets.ts` (+ test that parses `supabase/config.toml`).
- `.dependency-cruiser.cjs`: GoTrue admin and Storage calls only inside `adapters/supabase/`.
- Docs: `docs/decisions/27-settings-delete-account.md`, SRS FR-AUTH-04/05 status, `docs/backend/tutorials/delete-account.md` (what is removed where, how to check on local Supabase, the admin SQL), `docs/backend/README.md`, handbook glossary (erasure, cascade delete, service role) and learning log, `docs/backend/seed-data.md` (a throwaway account for tests is created by the test, not seeded).

### Part B: web

- `apps/web/src/features/settings/`: `model/` (`profile-form.schema.ts` from `updateProfileInputSchema`, `delete-word.ts`: the word per locale and `matchesDeleteWord(input, locale)` with trim and Unicode normalisation), `hooks/` (`use-profile.ts`, `use-update-profile.ts`, `use-switch-language.ts`, `use-delete-account.ts`), `components/` (`SettingsScreen.tsx`, `AccountCard.tsx`, `PhoneRow.tsx`, `DisplayCard.tsx`, `LanguageToggle.tsx`, `DeleteAccountCard.tsx`, `DeleteAccountDialog.tsx`), `index.ts`.
- `apps/web/src/app/[locale]/(dashboard)/settings/page.tsx` (thin).
- `apps/web/src/shared/layout/AppNav.tsx`: add the "الإعدادات" item (file created by #30; if #27 is built first, it creates the file with both items).
- `apps/web/src/shared/auth/access-guard.ts` (+ test): `/settings` protected.
- Post-deletion landing: `app/[locale]/page.tsx` shows a toast from `?account=deleted` (read-only query flag, removed from the URL); `shared/auth` gets `clearLocalSession()` that signs out locally and ignores the error the vanished user causes.
- `packages/ui`: `Button` gains a `dangerOutline` variant (design: white background, red border and text) with story and test; the dialog's confirm button uses the existing `danger`.
- `apps/web/messages/{ar,en}.json`: `settings.*`, `deleteAccount.*`, `errors.accountDeleteForbidden`; `docs/design/copy.md` glossary: "delete account / حذف الحساب", the confirmation word.
- `apps/web/e2e/settings.spec.ts` and a throwaway-user helper (sign-up through the API with the service role, deleted afterwards).
- Docs: `docs/test-cases/auth/27-settings-delete-account.md`, screenshots in `docs/test-cases/auth/screenshots/`, `docs/frontend/README.md` (settings feature, language persistence), `docs/design/screens/README.md` row status.

## Data, schema and API contract

- Migration: one function, no table or grant changes.
- `GET /api/profile` → `200 { name, locale, email }` · `401`.
- `PATCH /api/profile` `{ name?, locale? }` → `200 profile` · `400 VALIDATION_FAILED` · `401`.
- `DELETE /api/account` `{ confirm: "DELETE_MY_ACCOUNT" }` → `204` · `400 VALIDATION_FAILED` · `401` · `403 ACCOUNT_DELETE_FORBIDDEN` · `500 INTERNAL_ERROR` (nothing irreversible done if it fails before step 4; repeating is safe).
- Postman: profile requests in the generated folder; `DELETE /api/account` is state-changing and destructive, so it stays out of the generated run (as the phone requests did in #26) and gets a manual request with its own throwaway account.

## Test plan

- **Unit (Vitest):** `matchesDeleteWord` ("حذف", " حذف ", "DELETE", "delete" in English rejects wrong case or the other language's word); profile schemas (empty name, 121 characters, `null` name allowed, locale `fr` rejected, empty patch rejected, `confirm` other than the literal rejected); `STORAGE_BUCKETS` equals `config.toml`; env pair rule for PostHog.
- **Services with memory adapters:** `get-profile`; `update-profile` (name, locale, only own row); `delete-account` happy path calls files → identity → deleter → audit in that order; each earlier failure stops before the deleter and keeps the account; deleter 404 is success; audit failure is reported and still resolves; admin → `ACCOUNT_DELETE_FORBIDDEN` with nothing called; repeat after a partial run completes; the audit input holds no id (the fake records its arguments).
- **Routes:** 401 without a token on all three; strict bodies (a `userId` in the body is ignored/rejected); `DELETE` without `confirm` → 400; response bodies match the schemas; another user's id can never be passed (the id comes from the token).
- **Adapters:** `gotrue-account-deleter` and `storage-files-remover` with a fake `fetch` (request shapes, paging, 404 handling, error mapping); `posthog-identity-eraser` fake `fetch`; against local Supabase in `repositories.db.test.ts` style: create a user with a client, a measurement set and an uploaded object, delete through the real adapters, then assert with the service role that the auth user, profile, client, set, object and `phone_otp_events` rows are gone.
- **The trial rule (acceptance test):** local Supabase: user A verifies test number `+201000000006` through the private functions, A is deleted through `delete-account`, user B tries to verify the same number → `phone_already_used`; `trial_phones` still has the hash with `user_id` null.
- **pgTAP (`account-deletion.test.sql`):** `anon` and `authenticated` cannot execute `private.record_account_deleted`; `api_app` and `service_role` can; one call adds exactly one row with `who is null`, `target is null`, `before` and `after` null; deleting an `auth.users` row cascades profile, clients, sets and OTP events, keeps `trial_phones` (user_id null) and keeps the user's earlier `admin_audit` rows with `who` null; another user's rows are untouched.
- **Component tests:** account card disables "حفظ" until the name changes and shows the API field error; phone row shows tick or the not-verified link; language toggle marks the current language with `aria-pressed`, navigates, and shows a toast when the save fails (the switch stays); delete dialog keeps the button disabled until the exact word, shows pending and error states, never closes on failure; messages parity.
- **E2E (Playwright, local Supabase, ar and en):** sign in → open settings from the nav → change the name → reload shows it; switch to English → URL `/en/settings`, layout LTR, reload keeps English, the profile locale is `en` (read with the service role); delete flow with a throwaway user: dialog, wrong word keeps the button disabled, right word deletes, lands on `/` with the notice, signing in with the old credentials shows the generic wrong-password error, and the service role finds no profile. Toasts matched with `{ exact: true }` and alerts through `appAlert` (lessons of #111).
- **Visual:** screenshots of the three cards and the dialog in ar/en, mobile 390 px and desktop 1280 px against `docs/design/screens/images/Settings.*.png`; story for `dangerOutline`.
- **Manual test cases (draft, `docs/test-cases/auth/27-settings-delete-account.md`):** TC-AUTH-27-01 open settings from the nav · 02 change the name · 03 empty name error · 04 phone row verified · 05 phone row not verified · 06 switch to English, stays after reload · 07 switch back to Arabic · 08 units text · 09 delete dialog cancel keeps everything · 10 wrong word keeps the button disabled · 11 delete with the right word signs out and shows the notice · 12 deleted user cannot sign in again · 13 deleted user's clients and sets are gone (service role query) · 14 same phone cannot get a new trial (needs #26 part B for the full UI check) · 15 admin account sees the forbidden message · 16 API without token → 401 · 17 Postman manual delete request on staging with a throwaway account · 18 mobile and English layouts.

## Docs to update

Listed per part above; plus `docs/milestones/M1-accounts-and-data.md` (#27 depends on #25 and uses #26's table), `docs/backend/tutorials/switch-environment.md` (the two optional PostHog variables), `docs/handbook/learning-log.md`. `CLAUDE.md` status only if the next step changes.

## Risks and how they are handled

- **Irreversible action:** the typed word, the API literal, the admin guard, the ordered steps and the repeat-safe design are the protection; there is no soft delete. Deletion is tested end to end only on throwaway accounts, never on seed users (`docs/test-cases` say so).
- **A deleted user's token stays valid until it expires (up to one hour):** every route reads through RLS, which finds no profile, so reads return empty or `404` and writes fail on the foreign key; `GET /api/me` still answers from the token. Acceptable for M1; GoTrue also revokes refresh tokens. Noted in the decision.
- **Third systems fail halfway:** files removed but the auth user still there → the user retries and the removal finds nothing to do. PostHog down → the request fails before the irreversible step, with a clear retry message (not silent).
- **Backups:** deleted rows may remain in Supabase backups until they expire; the privacy policy text (M8) must say so. Noted in the tutorial, not solved here.
- **Service role key in the API process:** already required by `env.ts`; only `gotrue-account-deleter` and `storage-files-remover` use it (dependency-cruiser rule), never a route or service. **Security-sensitive, Merna to know.**
- **Overlap with #30:** `AppNav`, `access-guard.ts` and `messages/*.json` are touched by both. Namespaced keys (`settings.*`, `deleteAccount.*`, `nav.*` shared) and one list of nav items keep conflicts to a trivial keep-both merge; part A touches none of them.
- **Arabic copy:** the design has the main texts; the dialog, the notice and the error need Merna's review in the PR.

## Merna does

- Approve the split (A then B) and decisions 1, 2, 3 and 6.
- Optional now, needed before the beta: create a PostHog personal API key and set `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` (GitHub secret for staging, Vercel variable); steps in the tutorial.
- Review the Arabic texts that are not in the design.

## Labels

`size:S` → `size:M` (whole issue; two PRs). `plan:sonnet`, `build:sonnet` kept (existing patterns; the sensitive parts are small and listed above). `scripts/needs-interactive.mjs` on the files above: `no`. Status stays `status:plan-review` until Merna approves.
