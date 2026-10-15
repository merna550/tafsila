# Plan 34 - M1 exit check

The issue body is the plan. One Playwright spec (`apps/web/e2e/m1-exit.spec.ts`, ar-desktop only) covers sign up, mail confirm, test-phone verify, add client, set from size M with two overrides, sign out, and a second user in a separate browser context who cannot see the client. Test phone `201000000010` is added to `supabase/config.toml`. The Postman "Clients and measurements" folder already covers the API flow (`pnpm api:test --base-url <staging>`). Staging runs and the High manual cases are Merna's.
