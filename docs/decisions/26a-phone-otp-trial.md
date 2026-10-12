# ADR-26a · 2026-10-12 · Phone verification by OTP and one free trial per number

**Context:** Issue #26 (FR-AUTH-02, FR-AUTH-03, FR-BILL-02 eligibility flag, NFR-04, NFR-05). Part A (database, API, config) is built; part B (verify screen, e2e) follows. Plan: `docs/plans/26-phone-otp-trial.md`.
**Decision:**

1. **The API owns the flow, behind a `PhoneOtp` port.** `POST /api/phone/code` and `/verify` run every check before any code is sent; the first adapter is Supabase Auth phone change (GoTrue REST). WhatsApp or another channel at M8 is a new adapter plus one line in `container.ts`. Not the browser calling `updateUser({ phone })` (checks could be skipped), not our own code table (we would own expiry and brute-force protection).
2. **One shared normaliser** (`@tafsila/utils` `normalizeEgyptianMobile`): Arabic-Indic and Persian digits, spaces, `-`, `.`, brackets and direction marks removed; accepts `01[0125]…`, `1[0125]…`, `+20`, `0020`, `20` forms and `+200…`; output `+201[0125]XXXXXXXX`; anything else is `PHONE_INVALID`. The Zod request schemas in `packages/schemas` stay generic (`schemas` may only depend on zod, depcruise rule), so the API normalises in the service; the web form (part B) builds its own schema from the same normaliser.
3. **`trial_phones` stores `HMAC-SHA256(PHONE_HASH_SECRET, e164)` only.** A plain SHA-256 can be reversed (about 400 million Egyptian mobiles). `user_id` is `on delete set null`, so a deleted account keeps its hash and the number can never get a second trial.
4. **`profiles.phone` stays** (plain E.164, unique) for the live account; history uniqueness comes from `trial_phones`; both are checked before sending and inside `private.confirm_phone`.
5. **A number in `trial_phones` cannot verify another account, even after the first is deleted.** A support path to clear a hash is noted for M8.
6. **Rate limits (NFR-04)** through `private.phone_otp_attempt` (one advisory lock, events older than 24 h deleted in the same call). Send: account 1/60 s, 5/h, 10/day; number 5/h, 10/day; IP 30/h. Wrong codes: account 5/15 min, number 10/h, IP 50/h; a correct code is never blocked by the IP limit alone. Constants in `domain/phone-limits.ts`; the same pure `evaluateLimits` drives the memory adapter. The IP is the first `x-forwarded-for` hop, stored only as an HMAC (`ip:` prefix) for 24 h. 429 answers carry `details.retryAfterSeconds` and `Retry-After`.
7. **Trial eligibility for M7:** `private.is_trial_eligible(user)` (verified, hash row belongs to the user, `trial_granted_at is null`), exposed as the `TrialEligibility` port and as `trialEligible` in `GET /api/phone`. M7 sets `trial_granted_at` in the same transaction as the credits.
8. **Only `private.confirm_phone` writes `phone_verified_at`.** `security definer`, schema `private` (not exposed by PostgREST), `execute` only for `api_app` and `service_role`; the API reaches it through `withApiRole` (a plain transaction as `api_app`, which holds no table privileges). This extends ADR-035 (1) with one narrow, database-enforced exception. **Security-sensitive.** Raises SQLSTATE `PH001` (used) and `PH002` (already verified).
9. **Test numbers only outside production.** `PHONE_TEST_NUMBERS` (default `+201000000001` to `...09`) is an allow-list applied whenever `APP_ENV` is not `production` (`PHONE_TEST_ONLY`); `env.ts` refuses the variable in production. GoTrue also knows only the nine test numbers plus a dummy Twilio entry, so no real SMS can leave local or staging. Seeds use 1, 2, 4; `empty@` verifies with 3; e2e uses 5 to 7; 8 and 9 are for manual tests.
10. **The verify step is soft-gated** (part B): after sign-up the user lands on `/verify-phone`, can go back to the dashboard (banner shown); the hard gate is the trial itself.
11. **No PII anywhere but `profiles.phone`:** not in analytics (strict events `phone_code_requested`, `phone_verified`, `phone_verification_failed`), logs or error details; `scrubEvent` masks phone-shaped text in URLs.
12. **`PHONE_ALREADY_USED` reveals that a number is or was used.** Unavoidable for a clear message; account and IP limits keep it from checking many numbers. **Security-sensitive, Merna to accept.**
13. **A bad phone configuration only fails the phone routes** (`createPhoneServices` catches the config error and installs rejecting adapters), so `/api/health` still answers.

14. **The verify screen is `/verify`** (part B), soft-gated by the guard; the code boxes are a `packages/ui` component; the web form builds its schema from the same `normalizeEgyptianMobile`; the confirmation link and first Google sign-in continue to `/verify?next=...` and then the welcome dashboard; a dashboard notice shows while the phone is unverified.

15. **`[auth.sms] enable_confirmations` must be true** (found by the e2e flow in CI): with false GoTrue auto-confirms a phone update, sends no code, and the number is attached without verification. Set in `supabase/config.toml` and the staging remote block.

**Still open (to verify on staging):** the SMS OTP expiry. The CLI config has no key for it, so GoTrue's default applies; the target of 10 minutes is not yet checked. Merna or the staging run confirms it (TC-AUTH-26-20) before M8.

**Risks to know:**

- `PHONE_HASH_SECRET` must be the same value for the Vercel Production target (staging) and Preview (previews share the staging database); losing or rotating it makes old hashes useless. Generate once per environment: `openssl rand -base64 32`.
- GoTrue now sees the API's IP, so its per-IP `token_verifications` limit is one shared ceiling; raise it before M8.
- Once GoTrue marks the phone confirmed, phone sign-in would also work for that user. We never show it and `enable_signup = false` stops phone-only accounts; the SMS-cost side belongs to the M8 provider decision.
- The CLI config has no key for the SMS OTP expiry (GoTrue default applies); the target of 10 minutes is checked on staging in part B.
- Postman ERR cases use the throwaway test server with memory adapters; the real database paths are covered by pgTAP.

**Reason:** Every check runs before any SMS can be bought, the trial cannot be repeated with a new account or a deleted one, and the channel can change at M8 without touching routes, tables or UI.
**Alternatives:** direct browser calls to Supabase (unchecked); own code table (more security code to own); plain hash (reversible); one global limiter (cannot separate account, number and IP).
