# Plan #26: Phone verification by OTP + one free trial per phone number

Issue: #26 · plan:opus · build:sonnet · Milestone: M1 - Accounts & data · size:L (was M) · FR-AUTH-02, FR-AUTH-03, FR-BILL-02 (eligibility flag only), NFR-04, NFR-05

Depends on #25 (merged) and on #29 / PR #105 (`withUser`, `DATABASE_URL`, the Drizzle mirror): part A below cannot start before #105 is merged. Blocks #27 (delete account keeps only the hashed trial phone), #32 (users list shows "verified") and M7 (trial credits).

## Why the size goes from M to L, and the split

The issue touches the database (two tables, private functions, pgTAP), the API (three endpoints, four ports, rate limiting), the web app (a new screen, a new shared input, the post-sign-up redirect) and staging config. That does not fit one 50-turn run (ADR-032). One issue, two PRs ("Part of #26"), built in order, each with the checkpoint rule:

| Part | What                                                                                                                                 | Size |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| A    | Normaliser, migration + pgTAP, ports/adapters, the three endpoints, error codes, analytics events, config, seed, staging block, docs | M    |
| B    | `/verify-phone` screen, `CodeInput` in `packages/ui`, post-sign-up redirect and dashboard banner, e2e, test cases, screenshots       | M    |

## Approach

The API owns the whole flow; the browser never talks to Supabase Auth for the phone. Every check (format, already used, rate limits, test-only numbers) runs **before** any code is sent, so nobody can burn SMS money or skip a check by calling Supabase directly.

1. `POST /api/phone/code {phone}`: normalise to E.164 → refuse if this account is already verified → keyed hash of the number → rate limits (account, number, IP) → refuse if the hash is in `trial_phones` or the number is on another live profile → in non-production refuse numbers outside the test list → ask the `PhoneOtp` port to send.
2. `POST /api/phone/verify {phone, code}`: normalise → failed-attempt limits → `PhoneOtp.verify` → the returned user id must equal the caller → one database function writes `profiles.phone`, `profiles.phone_verified_at` and the `trial_phones` row in one transaction (re-checks uniqueness under a lock, so two accounts racing for one number cannot both win).
3. `GET /api/phone`: `{ verified, phone, trialEligible }` for the screen, the dashboard banner and #27's settings.

The first and only `PhoneOtp` adapter uses **Supabase Auth phone change** (GoTrue REST `PUT /auth/v1/user {phone}` with the caller's access token, then `POST /auth/v1/verify {type: "phone_change"}`). GoTrue generates, stores, expires and checks the code, honours the ADR-021 test numbers, and sends through whichever SMS provider is configured. WhatsApp or another channel at M8 is a new adapter (or Supabase's Send SMS hook) plus one line in `container.ts`; no route, UI or table changes.

## Decisions (the build writes them in `docs/decisions/26-phone-otp-trial.md`)

1. **Where the OTP is sent and verified: our API in front of Supabase phone auth, behind a `PhoneOtp` port.** Recommended over (a) the browser calling `supabase.auth.updateUser({ phone })` directly (any check we add can be skipped and per-number limits are impossible) and (b) our own code table and sender (we would own code storage, expiry and brute-force protection, and the dummy-provider setup of ADR-021 would be wasted). The production channel stays an M8 decision (ADR-024 (3)).
2. **Accepted formats (one shared normaliser, used by the API and the form).** First: convert Arabic-Indic (`٠-٩`) and Persian (`۰-۹`) digits, remove spaces, `-`, `.`, `(`, `)` and invisible direction marks (U+200E/F, U+202A-E, U+2066-9) that come with copy-paste from Arabic text. Then accept exactly: `01[0125]` + 8 digits; `1[0125]` + 8 digits (typed after the fixed `+20` box); `+201[0125]…`, `00201[0125]…`, `201[0125]…`; and `+20` followed by the trunk `0` (`+20 010…`, what people type after the `+20` box). Output is always `+201[0125]XXXXXXXX`. Everything else is `PHONE_INVALID`: landlines (`02…`, `03…`), other prefixes (`013`, `014`, `016`-`019`), wrong length, other country codes, letters. Display helper turns `+201012345678` into `010 1234 5678` (as in the design), always rendered LTR.
3. **`trial_phones` stores only `HMAC-SHA256(PHONE_HASH_SECRET, e164)`, never the number.** A plain SHA-256 is useless here: there are only about 400 million Egyptian mobile numbers, so a leaked table could be reversed in minutes; the keyed hash cannot be reversed without the secret, which lives only in the API environment (never in the database, seed excepted locally). Columns: `phone_hash bytea primary key`, `user_id uuid null references auth.users on delete set null`, `first_verified_at`, `trial_granted_at null` (set by M7). `on delete set null` means #27's delete-account flow needs no extra code: the row survives, the link to the person disappears.
4. **`profiles.phone` stays** (plain E.164, unique partial index from #24): it is the live account's own number, shown in settings (#27) and needed for messages at M8; it disappears with the account (cascade). Uniqueness between live accounts comes from that index; uniqueness across history (deleted accounts) comes from `trial_phones`. Both are checked before sending and again inside the confirm function.
5. **A number seen in `trial_phones` cannot verify any other account, even after the first account is deleted** (the issue's acceptance criterion). Consequence: someone who deletes the account and signs up again cannot verify that number; they keep using the app without the trial. A support path (admin clears a hash after checking identity) is noted for M8, not built now.
6. **Rate limits (NFR-04), enforced in our API through one database function** (`private.phone_otp_attempt`, atomic count-then-insert under an advisory lock; events older than 24 h are deleted in the same call, so no cron). Values (constants in `domain/phone-limits.ts`, cheap to tune):
   - send: per account 1 per 60 s (the design's countdown), 5 per hour, 10 per day; per number 5 per hour, 10 per day; per IP 30 per hour (mobile carriers put many users behind one IP, so it is generous);
   - wrong codes: per account 5 per 15 min, per number 10 per hour, per IP 50 per hour; a correct code is never blocked by the IP limit alone.
   - GoTrue's own limits stay as a second fuse (`sms_sent`, `token_verifications`); note they now see the API's IP, see Risks.
   - The IP is the first `x-forwarded-for` hop (set by Vercel), stored only as an HMAC (`"ip:" + ip`) for 24 h.
7. **"Eligible for trial" for M7:** SQL `private.is_trial_eligible(user_id) returns boolean` = profile verified AND its `trial_phones` row belongs to this user AND `trial_granted_at is null`; exposed to the API as `TrialEligibility.isEligible(userId)` (port + Drizzle adapter) and in `GET /api/phone` as `trialEligible`. M7 grants credits by setting `trial_granted_at` in the same transaction as the ledger row (`update … where trial_granted_at is null`), so one number can never get two trials.
8. **Who may write `phone_verified_at`:** only `private.confirm_phone(user_id, e164, phone_hash)`, a `security definer` function in a new `private` schema (not exposed by PostgREST), `execute` granted only to `api_app` and `service_role`. The API calls it through a new `withApiRole(fn)` helper next to `withUser` (a transaction as the `api_app` login role without `set role authenticated`; `api_app` has no table privileges, only `execute` on the `private` phone functions). The ADR-24a column grants stay: `authenticated` can still update only `name` and `locale`. This extends ADR-035 (1) ("the only door is `withUser`") with one narrow, database-enforced exception. **Security-sensitive.**
9. **Test numbers only outside production.** `PHONE_TEST_NUMBERS` (env, default `+201000000001…+201000000009`) is an allow-list the API applies whenever `APP_ENV` is not `production` (`PHONE_TEST_ONLY` otherwise); `env.ts` refuses the variable in production. Locally and on staging GoTrue also has only the dummy Twilio entry, so a real SMS is impossible twice over. The test list grows from 3 to 9 numbers (ADR-021 numbers 1 to 3 kept): seeds use 1, 2 and 4, `empty@` verifies with 3, e2e uses 5 to 7, 8 and 9 are for Merna's manual tests on staging.
10. **The verify step is soft-gated:** after the email confirmation (and after Google sign-up) the user lands on `/verify-phone?next=/dashboard`; "العودة" goes to the dashboard, which shows a "phone not verified" banner with a link until verified. The hard gate is the trial itself (M7 reads decision 7). Cheap to make stricter later.
11. **Code expiry and length:** 6 digits (design); expiry as long as GoTrue's SMS OTP setting allows, target 10 minutes (the build checks the config key and logs what it set).
12. **No PII anywhere but `profiles.phone`:** not in analytics, logs, Sentry, error `details` or audit. `packages/utils` `scrubEvent` also masks anything shaped like an Egyptian mobile.
13. **`PHONE_ALREADY_USED` tells the caller that a number is (or was) in use.** That is unavoidable for a clear message; the per-account and per-IP limits keep it from being used to check many numbers. **Security-sensitive, Merna to accept.**

## Files to create or change

### Part A: database, API, config

- `packages/utils/src/phone.ts` (+ `phone.test.ts`, export from `index.ts`): `normalizeEgyptianMobile(input): string | null`, `formatEgyptianMobile(e164): string`; `scrub-event.ts` gains the phone mask (+ test).
- `packages/schemas/src/phone.ts` (+ test, export): `egyptianMobileSchema` (Zod, uses the normaliser, message key `phone.invalid`), `sendPhoneCodeBody`, `sendPhoneCodeResponse { phone, resendAfterSeconds }`, `verifyPhoneBody { phone, code: /^\d{6}$/ after digit conversion }`, `verifyPhoneResponse { verifiedAt, trialEligible }`, `phoneStatusResponse { verified, phone | null, trialEligible }`, all with `.openapi({ example })` using test numbers only.
- `packages/schemas/src/analytics-events.ts` (+ test): `phone_code_requested { attempt: "first" | "resend" }`, `phone_verified { trial_eligible: boolean }`, `phone_verification_failed { reason: "invalid_code" | "already_used" | "rate_limited" | "send_failed" }`; `.strict()`; a test proves phone-shaped strings are rejected. Sent server-side through the existing `Analytics` port with the opaque user id.
- `supabase/migrations/<ts>_phone_verification.sql`: schema `private` (usage to `api_app`, `service_role` only); tables `public.trial_phones` and `public.phone_otp_events (id bigint identity, kind text check in ('send','verify_fail'), user_id uuid references auth.users on delete cascade, phone_hash bytea, ip_hash bytea, created_at)` with RLS enabled, all privileges revoked from `anon` and `authenticated`, no policies; functions `private.phone_status(user_id, phone_hash)` (taken / already used / free), `private.phone_otp_attempt(kind, user_id, phone_hash, ip_hash, limits jsonb) returns jsonb { allowed, retry_after_seconds, scope }`, `private.confirm_phone(user_id, e164, phone_hash) returns jsonb { verified_at, trial_eligible }` (raises `phone_already_used` / `phone_already_verified` with a fixed SQLSTATE the adapter maps), `private.is_trial_eligible(user_id)`; all `security definer`, `set search_path = ''`, `revoke all from public`, `grant execute to api_app, service_role`. Comment on `profiles` updated.
- `supabase/tests/database/phone.test.sql` (pgTAP matrix below).
- `supabase/config.toml`: `[auth.sms.test_otp]` numbers 1 to 9; `[auth.sms] enable_signup = false` (a phone may be added to an email account, never create one); SMS OTP expiry (decision 11).
- `.github/workflows/staging.yml`: `[remotes.staging.auth.sms.test_otp]` numbers 1 to 9 and `[remotes.staging.auth.sms] enable_signup = false`.
- `supabase/seed.sql`: `trial_phones` rows for seed numbers 1, 2, 4 (`extensions.hmac(…, '<local dev secret>', 'sha256')`, the same value as `.env.example`); `docs/backend/seed-data.md` updated (`empty@` verifies with `+201000000003`).
- `packages/config/src/env.ts` (+ test): `PHONE_HASH_SECRET` (min 32 chars; required in staging, preview and production; local/ci default comes from `.env.example` / `.github/ci.env`), `PHONE_TEST_NUMBERS` (comma list of E.164, refused when `APP_ENV=production`); `.env.example`, `.env.docker.example`, `.github/ci.env`.
- `packages/api/src/domain/phone-limits.ts` (+ test): the limit constants and the pure function that turns the database counts into allow / `retryAfterSeconds`.
- `packages/api/src/domain/errors.ts` + `docs/errors.md`: new codes (table below).
- Ports: `ports/phone-otp.ts` (`send(accessToken, e164)`, `verify(e164, code) → { userId }`), `ports/phone-hasher.ts` (`phone(e164)`, `ip(ip)` → `Uint8Array`), `ports/phone-verification-repository.ts` (`status`, `attempt`, `confirm`), `ports/trial-eligibility.ts` (`isEligible(userId)`).
- Adapters: `adapters/supabase/gotrue-phone-otp.ts` (fetch to GoTrue REST with the anon key; maps GoTrue `otp_expired` / `invalid_otp` → `PHONE_CODE_INVALID`, `phone_exists` → `PHONE_ALREADY_USED`, `over_sms_send_rate_limit` → `PHONE_TOO_MANY_ATTEMPTS`, transport and provider errors → `PHONE_SEND_FAILED`; tokens returned by verify are discarded), `adapters/system/hmac-phone-hasher.ts` (`node:crypto`), `adapters/supabase/phone-verification-repository.ts` and `trial-eligibility.ts` (Drizzle through `withApiRole`), `adapters/supabase/with-user.ts` gains `createWithApiRole` (guard test: it can call the `private` phone functions and still reads no table), `adapters/memory/phone-otp.ts` (test numbers + `123456`), `adapters/memory/phone-verification-repository.ts`; `adapters/supabase/rejecting-repositories.ts` covers the new ports when `DATABASE_URL` is missing.
- Services: `services/send-phone-code.ts`, `services/verify-phone.ts`, `services/get-phone-status.ts` (+ tests with memory adapters and the `Clock` port).
- Route: `routes/phone.ts` (`GET /api/phone`, `POST /api/phone/code`, `POST /api/phone/verify`, all behind `requireAuth()`; `Retry-After` header on 429; client IP helper reads `x-forwarded-for`) + `routes/phone.test.ts`; `app.ts`, `container.ts`, `openapi/document.ts`; `pnpm api:openapi && pnpm api:postman`; Postman ERR cases for the new codes.
- `.dependency-cruiser.cjs`: `node:crypto` HMAC only in the hasher adapter; the `private` functions are called only from `adapters/supabase/`.
- Docs: `docs/decisions/26-phone-otp-trial.md`, SRS FR-AUTH-02/03 status and FR-BILL-02 note, `docs/backend/README.md` (phone flow, `withApiRole`), tutorial `docs/backend/tutorials/phone-otp.md` (local test numbers, staging secret setup, how M8 swaps the channel, how to clear a test hash on staging), `docs/backend/tutorials/add-migration.md` (the `private` schema rule), handbook glossary (E.164, OTP, HMAC/keyed hash, security definer), learning log.

### Part B: web

- `packages/ui/src/code-input.tsx` (+ story, unit test, visual snapshot): `CodeInput` with N boxes, `inputMode="numeric"`, `autoComplete="one-time-code"`, paste fills all boxes, Arabic-Indic digits converted, always `dir="ltr"` inside RTL pages, `aria-label` per box from props (no literal text). `Input` gains a `prefix` slot for the fixed `+20` box if it has none (snapshot updated).
- `apps/web/src/features/phone-verification/`: `model/verify-phone.schema.ts` (uses `egyptianMobileSchema`), `hooks/use-send-code.ts`, `use-verify-code.ts`, `use-resend-countdown.ts` (60 s, from `resendAfterSeconds`; `retryAfterSeconds` on 429), `components/VerifyPhoneForm.tsx` (two steps on one card as in the design: number → code; "تغيير الرقم" returns to step 1), `StepHeader.tsx` ("العودة", "الخطوة 2 من 2", progress bar), `PhoneNotVerifiedBanner.tsx`, `index.ts`. Built from `packages/ui` only; errors through `useApiErrorHandler` (field errors under the number or the code, 429 as a toast with the countdown).
- `apps/web/src/app/[locale]/(dashboard)/verify-phone/page.tsx` (signed-in only; already verified → redirect to `next`); `apps/web/src/shared/auth/access-guard.ts` protects `/verify-phone` (+ test); `shared/auth/route-handlers.ts` sends new sign-ups (`/auth/confirm` signup and Google first sign-in) to `/verify-phone?next=/dashboard` keeping the `welcome` tracker (+ tests); `(dashboard)/dashboard/page.tsx` shows the banner from `GET /api/phone`.
- `apps/web/messages/{ar,en}.json`: `phoneVerification.*` (title, intro "سنرسل إليك رمزاً من 6 أرقام. يمنحك التأكيد 3 باترونات مجانية، مرة واحدة لكل رقم.", sent notice, resend countdown, buttons, banner) and the new error texts; `docs/design/copy.md` glossary gains "free trial / تجربة مجانية" and "resend code / إعادة الإرسال".
- `apps/web/e2e/verify-phone.spec.ts` + global cleanup of e2e users and their `trial_phones` rows (service role, local only).
- Docs: `docs/test-cases/auth/26-phone-verification.md`, screenshots in `docs/test-cases/auth/screenshots/` (ar/en, mobile/desktop, code half-entered, countdown), `docs/frontend/README.md` (CodeInput), `docs/design/screens/README.md` row status.

## Data, schema and API contract

- Migration: `private` schema, `trial_phones`, `phone_otp_events`, four functions; no change to `profiles` columns or grants.
- `GET /api/phone` → `200 { verified, phone, trialEligible }` · `401`.
- `POST /api/phone/code` `{ phone }` → `202 { phone, resendAfterSeconds }` · `400 PHONE_INVALID | PHONE_TEST_ONLY` · `409 PHONE_ALREADY_USED | PHONE_ALREADY_VERIFIED` · `429 PHONE_RESEND_TOO_SOON | PHONE_TOO_MANY_ATTEMPTS` (`details.retryAfterSeconds`, `Retry-After`) · `502 PHONE_SEND_FAILED`.
- `POST /api/phone/verify` `{ phone, code }` → `200 { verifiedAt, trialEligible }` · `400 PHONE_INVALID | PHONE_CODE_INVALID` · `409 PHONE_ALREADY_USED | PHONE_ALREADY_VERIFIED` · `429 PHONE_TOO_MANY_ATTEMPTS`.

New error codes (Arabic: simple fusha, gender-neutral, per `copy.md`; Merna reviews the wording):

| Code                      | HTTP | Arabic                                                                     | English                                                                 |
| ------------------------- | ---- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `PHONE_INVALID`           | 400  | رقم الهاتف غير صحيح. يُكتب رقم محمول مصري يبدأ بـ 010 أو 011 أو 012 أو 015 | Enter an Egyptian mobile number starting with 010, 011, 012 or 015      |
| `PHONE_TEST_ONLY`         | 400  | تُقبل أرقام الاختبار فقط في هذه البيئة                                     | Only test numbers work in this environment                              |
| `PHONE_ALREADY_USED`      | 409  | هذا الرقم مستخدم في حساب آخر. لكل رقم تجربة مجانية واحدة                   | This number is used by another account. Each number gets one free trial |
| `PHONE_ALREADY_VERIFIED`  | 409  | رقم الهاتف مؤكَّد بالفعل                                                   | Your phone number is already verified                                   |
| `PHONE_CODE_INVALID`      | 400  | رمز التأكيد غير صحيح أو انتهت صلاحيته                                      | The code is wrong or has expired                                        |
| `PHONE_RESEND_TOO_SOON`   | 429  | يمكن طلب رمز جديد بعد دقيقة                                                | You can ask for a new code in a minute                                  |
| `PHONE_TOO_MANY_ATTEMPTS` | 429  | محاولات كثيرة. يمكن المحاولة مرة أخرى بعد قليل                             | Too many attempts. Try again later                                      |
| `PHONE_SEND_FAILED`       | 502  | تعذّر إرسال الرمز. يمكن المحاولة مرة أخرى                                  | We could not send the code. Try again                                   |

## Test plan

- **Unit (Vitest):**
  - normaliser, accepted: `01012345678`, `010 1234 5678`, `010-1234-5678`, `1012345678`, `+201012345678`, `00201012345678`, `201012345678`, `+2001012345678`, `٠١٠١٢٣٤٥٦٧٨`, `۰۱۱۱۲۳۴۵۶۷۸`, `‎+20 115 123 4567`, one per prefix 010/011/012/015 → `+2010…/+2011…/+2012…/+2015…`;
  - rejected: `0221234567` (Cairo landline), `03…`, `01312345678`, `01612345678`, `0101234567` (10 digits), `010123456789` (12), `+966501234567`, `+2010123456a`, empty, `+20`;
  - `formatEgyptianMobile`, `scrubEvent` masks `+2010…`/`010…`;
  - `phone-limits`: 60 s cooldown edge (59 s blocked, 60 s allowed), hour/day windows, `retryAfterSeconds` is the time to the oldest event leaving the window;
  - services with memory adapters: send happy path (first / resend events); already verified; number on another live account; hash of a deleted account; non-test number with `APP_ENV=staging` → `PHONE_TEST_ONLY`, same number with `APP_ENV=production` passes the guard; each limit scope; GoTrue send failure → `PHONE_SEND_FAILED`, no event left that blocks a retry beyond the cooldown; verify wrong code records `verify_fail`; GoTrue returns another user id → `PHONE_CODE_INVALID`; confirm race → `PHONE_ALREADY_USED`; success emits `phone_verified` without the number;
  - routes: 401 without token on all three; body validation; 429 sets `Retry-After`; the user id always comes from the token (a `userId` field in the body is ignored, strict schema); OpenAPI document test;
  - GoTrue adapter with a fake `fetch`: request shapes and error mapping; hasher: same input → same bytes, different secret → different bytes, phone vs IP domain separation;
  - `env.ts`: secret required outside local/ci, `PHONE_TEST_NUMBERS` refused in production;
  - web: `use-resend-countdown` (fake timers), `access-guard` for `/verify-phone`, confirm route redirect, `CodeInput` paste and Arabic digits, message parity.
- **pgTAP (`phone.test.sql`):** RLS on both tables; `anon` and `authenticated` get `permission denied` for select/insert/update/delete on `trial_phones` and `phone_otp_events`; `authenticated` and `anon` cannot execute any `private` function, `api_app` and `service_role` can; `authenticated` still cannot update `profiles.phone` or `phone_verified_at`; user A confirms hash H → profile and `trial_phones` set, `is_trial_eligible(A)` true; second account B confirms H → `phone_already_used`, B's profile unchanged; delete A from `auth.users` → profile gone, `trial_phones` row kept with `user_id` null; B confirms H again → still refused; C confirms H2 → ok; A confirms twice → `phone_already_verified`; `trial_granted_at` set → eligible false; another user's `select` on `profiles` still sees no foreign phone; `phone_otp_attempt`: sixth send in an hour refused, B's account limit unaffected by A's events while the shared number and IP limits count both; events older than 24 h are purged.
- **Adapter integration (local Supabase, the `repositories.db.test.ts` pattern):** real GoTrue with test number 5: send, verify `123456`, confirm; create user A, verify, delete A through the admin API, user B → `PHONE_ALREADY_USED` (the acceptance test "even after the first account is deleted").
- **E2E (Playwright, local Supabase):** sign up → confirm mail → lands on `/verify-phone` → `010 0000 0005` → code `123456` → dashboard without the banner; a second new account with the same number → Arabic `PHONE_ALREADY_USED` under the field; wrong code → error under the code; resend button disabled with the countdown, enabled after it (Playwright clock); "العودة" → dashboard with the banner; one smoke run in `en` (LTR, number still LTR); mobile 390 px and desktop 1280 px.
- **Visual:** `CodeInput` snapshots (empty, half-filled, error, RTL page); PR screenshots of the screen.
- **Manual test cases (draft, `docs/test-cases/auth/26-phone-verification.md`):** TC-AUTH-26-01 new account lands on the verify step · 02 verify with a test number and `123456` · 03 each accepted format (`010…`, `+2010…`, `002010…`, Arabic digits) gives the same number · 04 landline / `013` / short number rejected with the Arabic message · 05 wrong code · 06 resend countdown 60 s, then resend works · 07 too many sends → wait message · 08 second account with the same number refused · 09 deleted account's number refused (after #27, re-run) · 10 non-test number on staging → test-only message, no SMS · 11 "تغيير الرقم" · 12 "العودة" then banner on the dashboard · 13 already verified user opening `/verify-phone` is sent on · 14 English mode · 15 mobile width and the iOS/Android one-time-code autofill · 16 API without token → 401 · 17 Postman ERR cases.

## Staging behaviour

- Same flow as local: GoTrue has only test numbers 1 to 9 (code `123456`) and the dummy Twilio entry, and the API refuses any other number before calling GoTrue. No real SMS can leave staging or previews.
- `PHONE_HASH_SECRET` must be **the same value for the Vercel Production target (staging) and Preview target**, because previews share the staging database (ADR-023); otherwise a preview would not recognise numbers verified on staging. Production (M8) gets its own secret.
- Staging has no seed, so `trial_phones` starts empty; the tutorial shows how to remove a test hash in the SQL editor when Merna wants to re-run TC-08/09.

## Docs to update

Listed per part above; plus `docs/milestones/M1-accounts-and-data.md` (#26 depends on #29), `docs/CONTEXT_MAP.md` "New API endpoint" row mentions `withApiRole` for privileged writes, `CLAUDE.md` status only if the next step changes.

## Risks and how they are handled

- **GoTrue sees the API's IP, not the user's:** its per-IP `token_verifications` limit becomes one shared ceiling for all users. Fine for staging traffic; our own limiter is the real one; before M8 the value is raised (noted in the decision file and the M8 brief).
- **Phone sign-in side effect:** once GoTrue marks the phone confirmed, `signInWithOtp({ phone })` would also work for that user. We never show it; `enable_signup = false` stops phone-only accounts; the SMS-cost exposure of that path is part of the M8 provider decision (GoTrue limits `sms_sent` per hour as a fuse). **Merna to know.**
- **Losing or changing `PHONE_HASH_SECRET` makes the trial history useless** (old hashes no longer match). It is generated once per environment (`openssl rand -base64 32`), kept as a GitHub secret and a Vercel variable, never rotated without a plan. **Merna to know.**
- **Race of two accounts for one number:** the confirm function takes an advisory lock on the hash and re-checks; the primary key on `trial_phones` is the last guard.
- **#29 not merged yet:** part A needs `withUser`/`DATABASE_URL`; if #105 changes shape, `withApiRole` follows it.
- **e2e reruns locally:** test numbers would stay in `trial_phones`; the e2e global setup deletes its own users and their rows first; CI starts fresh.
- **Arabic copy:** Merna reviews the error texts and `messages/ar.json` in part B.

## Merna does

- Approve the split (A then B) and decisions 1, 5, 8, 10, 13.
- Create `PHONE_HASH_SECRET_STAGING` (GitHub secret) and set `PHONE_HASH_SECRET` in Vercel for Production and Preview of the staging project (tutorial in part A).
- Review the Arabic texts in part B.

## Labels

`size:M` → `size:L` (whole issue; two M parts). `plan:opus`, `build:sonnet` kept (security and data model per WORKFLOW §2, but the build follows existing patterns). Not `needs:interactive` (`scripts/needs-interactive.mjs`: no). Status stays `status:plan-review` until Merna approves.
