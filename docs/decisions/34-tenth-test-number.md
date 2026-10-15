# ADR-34 · 2026-10-14 · A tenth phone test number

- Issue: #34. Extends decision 26-phone-otp-trial (nine test numbers).
- Context: the M1 exit e2e (`apps/web/e2e/m1-exit.spec.ts`) verifies a phone and a verified number can never be reused. Numbers 1, 2, 4 are seeds, 3 belongs to `empty@`, 5-9 are used by other e2e flows and manual tests.
- Decision: add `+201000000010` (code `123456`) to `DEFAULT_PHONE_TEST_NUMBERS`, `supabase/config.toml` and the staging `test_otp` block. The list stays test-only: the API still refuses every other number outside production and refuses test numbers in production.
- Cost to reverse: low (remove the entry and the e2e).
