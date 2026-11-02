# ADR-339 · 2026-11-02 · Design photos, ai_usage and unsupported_features

**Context:** Issue #339 (M6, ADR-335 item 6) stores garment photos privately and records AI usage so analysis (#340) can run on uploaded photos.

**Decision:**

1. **Path layout** `<userId>/<designId>/<slot>.<ext>` (`slot` = `front|back|side`). The first folder is the owner, so the existing account-deletion prefix rule (`UserFilesRemover`) already covers photos; storage policies also require the second folder to be a design the user owns.
2. **HEIC is converted to JPEG in the browser** (#341); the server stores JPEG, PNG and WebP only, and the bucket's allowed types stay as in `supabase/config.toml`.
3. **The migration creates the bucket row** for hosted environments (the config file only creates it locally).
4. **Signed read URLs live 5 minutes.** Signed upload URLs may replace an existing object (upsert), so re-uploading a slot replaces the photo.
5. **`ai_usage.cost_usd` is an estimate** from the provider's price list. **Daily caps count by UTC day** (00:00 UTC), computed by `utcDayStart`.
6. **The API role writes `ai_usage` and `unsupported_features` through `private` security-definer functions** (`record_ai_usage`, `ai_usage_count_since`, `record_unsupported_feature`), the same door as the phone and admin functions, because `api_app` holds no table privileges (ADR-035). Users can only read their own rows; admins read all. The functions drop a `design_id` that is not the user's; `unsupported_features` has a composite FK to `(design_id, owner_id)`.
7. **Deleting a design removes its photos first**, then the row, so a storage failure leaves the design in place and the request can be repeated.
8. **Service role key use** is limited to `adapters/supabase/storage-rest.ts` (shared Storage client used by the files remover and the photo adapter), the account deleter and the container (decision 27a, 8).

**Reason:** None is costly to reverse; the storage policies are security-sensitive and covered by pgTAP.

**Alternatives:** table grants for `api_app` on the new tables (breaks the "no table access" rule proven by pgTAP); `@supabase/supabase-js` for Storage (a new dependency for three REST calls).
