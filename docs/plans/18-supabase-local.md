# Plan #18: Local Supabase

Issue: #18 · plan:sonnet · build:sonnet · Milestone: M0 - Foundation & environments

The issue body is the plan. Done (ADR-021):

1. `supabase init`; `supabase/config.toml` edited: phone auth + three test OTP numbers (dummy Twilio provider, never called), email confirmations on (mail catcher), Google declared and disabled, private bucket `design-photos`.
2. Scripts `db:start`, `db:stop`, `db:reset`, `db:types` (writes `database.types.ts`).
3. `packages/config/src/env.ts`: `AI_MODEL_ANALYZE`, `AI_API_KEY`, `PAYMOB_API_KEY` optional, required when `APP_ENV=production` (tests added).
4. `.env.example`, `run-locally.md`, glossary (mail catcher, test OTP), learning log.
5. `.github/workflows/supabase.yml`: starts Supabase and runs `db:reset` on a fresh database.

## Found while building

Phone sign-in returned `phone_provider_disabled` with only `test_otp` set, so a dummy Twilio provider is enabled. Verified on a real local stack: `db:reset`, OTP login with `+201000000001`/`123456`, sign-up email in Mailpit, and the same with `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN` unset.
