# ADR-107 · 2026-10-12 · Staging uses Supabase's default auth emails until a free SMTP provider is chosen

**Context:** The first Staging run after the repo went public applied all migrations, then `supabase config push` failed with HTTP 400: Supabase Free refuses custom email templates ("Email template modification is not available for free tier projects using the default email provider"). `supabase/config.toml` declares the Arabic confirmation and recovery templates from #25, so `deploy` and `smoke` never ran.

**Decision:** The `migrate` job runs `scripts/strip-email-templates.mjs`, which removes the `[auth.email.template.*]` tables from the runner's copy of `supabase/config.toml` before `config push`. The committed file is unchanged, so local dev still shows the Arabic templates in the mail catcher. Staging sends Supabase's default (English) confirmation and recovery emails. Arabic emails on staging and production need a custom SMTP provider; free tiers exist (for example Resend or Brevo), and the provider is chosen before the beta together with the OTP channel (ADR-024 point 3).

**Reason:** Unblocks staging today at no cost (ADR-022) and keeps one committed config.

**Alternatives:** Supabase Pro (paid, ADR-022); adding a custom SMTP account now (a new account and secret before the email copy is final); deleting the templates from `config.toml` (loses the Arabic emails locally); keeping them and skipping `config push` (loses the test OTP numbers and redirect URLs on staging).
