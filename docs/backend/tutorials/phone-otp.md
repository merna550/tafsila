# Phone verification (OTP): run it, set the secret, change the channel

Plan #26 part A. Decision: [ADR-26a](../../decisions/26a-phone-otp-trial.md).

## Local

1. `.env.local` gets `PHONE_HASH_SECRET` from `.env.example` (already filled with a local value; `supabase/seed.sql` uses the same value for the seeded numbers).
2. `pnpm db:reset`. GoTrue knows test numbers `+201000000001` to `+201000000009`; the code is always `123456`; the API refuses any other number outside production (`PHONE_TEST_ONLY`).
3. Try it: sign in, `POST /api/phone/code {"phone":"010 0000 0005"}` then `POST /api/phone/verify {"phone":"010 0000 0005","code":"123456"}` (Postman folder "phone"). Seed numbers 1, 2, 4 are already used; use 5 to 9.

## Staging and previews: the secret

1. Generate once: `openssl rand -base64 32`.
2. Add the GitHub secret `PHONE_HASH_SECRET_STAGING` and the Vercel variable `PHONE_HASH_SECRET` with **the same value** for the Production target (staging) and the Preview target (previews share the staging database). Never rotate it without a plan: old hashes would stop matching and the trial history would be lost.
3. Production (M8) gets its own secret.

## Clear a test number on staging (to re-run a test case)

In the Supabase SQL editor, compute the hash with the staging secret and delete it:

```sql
delete from public.trial_phones
where phone_hash = extensions.hmac('+201000000008', '<PHONE_HASH_SECRET of staging>', 'sha256');
update public.profiles set phone = null, phone_verified_at = null where phone = '+201000000008';
```

## Change the channel at M8 (WhatsApp or another SMS provider)

Write a new `PhoneOtp` adapter (or point Supabase's Send SMS hook at the provider), change one line in `createPhoneServices` in `packages/api/src/container.ts`. Routes, services, tables and the UI do not change.
