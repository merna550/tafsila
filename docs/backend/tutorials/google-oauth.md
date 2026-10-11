# Tutorial: Google sign-in for staging

Google sign-in is off locally and on for staging (decision 25a-12). Merna does these steps once; no code changes are needed.

1. Open Google Cloud Console, create a project (free), then **APIs and services → OAuth consent screen**. Choose **External**, fill in the app name (Tafsila) and your email, and leave it in **Testing** mode. Add your own Google address (and any tester) under **Test users**.
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. Under **Authorised redirect URIs** add `https://<staging-ref>.supabase.co/auth/v1/callback` (`<staging-ref>` is the `SUPABASE_PROJECT_REF_STAGING` variable).
4. Copy the client ID and the client secret.
5. In GitHub (Settings → Secrets and variables → Actions) add the secrets `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`. The staging workflow pushes them to Supabase Auth together with the site URL and redirect URLs.
6. In Vercel (staging, Production target) set `AUTH_GOOGLE_ENABLED=true` and redeploy. The "Continue with Google" button appears on `/sign-in` and `/sign-up`.
7. Check: sign in with a test user on staging; a new Google account lands on `/dashboard` with the welcome toast.

Locally: to try it, create a separate OAuth client with redirect URI `http://127.0.0.1:54321/auth/v1/callback`, export the two `SUPABASE_AUTH_EXTERNAL_GOOGLE_*` variables, set `enabled = true` under `[auth.external.google]` in your own copy of `supabase/config.toml` (do not commit it), and set `AUTH_GOOGLE_ENABLED=true` in `.env`.

Never commit the client secret.
