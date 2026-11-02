# Plan #339: Private design photos, ai_usage and unsupported_features

plan:sonnet · build:sonnet · size M (unchanged) · M6 wave 1 · FR-DES-01, FR-DES-07, NFR-04, NFR-05, SRS §7, §8 · ADR-335 item 6 · existing: `designs.photo_paths text[]` and `designs.analysis jsonb` (migration `20261019120000`), local bucket `design-photos` in `supabase/config.toml` (jpeg/png/webp, 10 MiB), `UserFilesRemover` port that deletes `<userId>/` in each bucket (account deletion, #27)

### Approach

Use the `add-endpoint` skill.

**Migration `supabase/migrations/<ts>_design_photos_ai_usage.sql`:**

- Create the bucket for hosted environments: `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('design-photos', 'design-photos', false, 10485760, '{image/jpeg,image/png,image/webp}') on conflict do nothing` (local config already declares it; staging needs the row).
- Storage policies on `storage.objects` for `bucket_id = 'design-photos'`: a user can select/insert/delete only objects whose first path segment is `auth.uid()` **and** whose second segment is a design they own (`exists (select 1 from designs where id::text = split_part(name,'/',2) and owner_id = auth.uid())`). Path layout: `<userId>/<designId>/<slot>.<ext>` (`slot` = `front|back|side`), matching the existing `UserFilesRemover` prefix rule.
- **HEIC is not stored:** the browser converts it to JPEG before upload (#341); the bucket keeps its jpeg/png/webp list (no change to the local config).
- `ai_usage` (SRS §7: id, user_id, design_id?, kind `analyze|chat|explain`, provider, model, input_tokens, output_tokens, cost_usd numeric(10,6), latency_ms, created_at) — RLS: the owner selects own rows; inserts only through the API role (`api_app`), admins read all. Index on (user_id, created_at) for the daily caps.
- `unsupported_features` (id, design_id references designs on delete cascade, owner_id, feature_text, created_at) — owner select; insert by the API role; admin read (product research, FR-DES-07).

**Routes:**

- `POST /api/designs/:id/photos` (`{ photos: { slot, contentType, sizeBytes }[] }`, 1 to 3, `front` required on the first call, sizes ≤ 10 MB, types jpeg/png/webp) returns `{ uploads: { slot, path, signedUrl, token }[] }` via `createSignedUploadUrl` and records the paths in `designs.photo_paths` (replacing the same slot). Another user's design → 404.
- `GET /api/designs/:id/photos` returns `{ photos: { slot, path, url }[] }` with short-lived signed read URLs (5 minutes).
- `DELETE /api/designs/:id/photos/:slot` removes the object and the path.
- Deleting a design removes its photos (the delete-design service calls a new `DesignFilesRemover` port method `removeDesign(userId, designId)`); account deletion already removes `<userId>/` (verify with a test).
- New port `PhotoStorage` (`createUploadUrls`, `signedReadUrls`, `remove`, `removeDesign`) with a Supabase adapter (service role only inside the adapter, ADR-27a) and a memory adapter for tests.
- Error codes (bilingual): `PHOTO_FRONT_REQUIRED`, `PHOTO_TOO_LARGE`, `PHOTO_TYPE_NOT_ALLOWED`, `PHOTO_LIMIT_REACHED`, `PHOTO_NOT_FOUND`.
- OpenAPI, Postman (journey steps + ERR cases), seed-data docs (no seeded photos), tutorial `docs/backend/tutorials/design-photos.md`.

### Files

`supabase/migrations/<ts>_design_photos_ai_usage.sql`, `supabase/tests/database/design-photos.test.sql`, `packages/schemas/src/design-photos.ts` (+ test), `packages/api/src/ports/photo-storage.ts`, `adapters/supabase/photo-storage.ts`, `adapters/memory/photo-storage.ts`, `ports/ai-usage-repository.ts` + adapters (insert and `countToday(userId, kind)`; used by #340/#343, created here because the table is), services `create-photo-uploads.ts`, `list-photos.ts`, `delete-photo.ts`, change `delete-design.ts`, route `routes/design-photos.ts`, container wiring, Drizzle schema for the two tables, tests next to each; `docs/errors.md`, `docs/SRS.md` §7/§8, `docs/decisions/339-design-photos.md`, `docs/test-cases/api/339-design-photos.md`, glossary (signed URL), learning log.

### Test plan

- **Services (memory):** 1 to 3 uploads; no `front` on an empty design → `PHOTO_FRONT_REQUIRED`; 11 MB → `PHOTO_TOO_LARGE`; `image/heic` → `PHOTO_TYPE_NOT_ALLOWED`; a 4th slot → `PHOTO_LIMIT_REACHED`; re-upload of `front` replaces the path; delete slot; another user's design → 404; deleting the design calls `removeDesign`.
- **Routes:** 401 without token; shapes match the Zod schemas; OpenAPI test.
- **pgTAP:** storage policies: owner can insert/select/delete under `<uid>/<own design>/`; another user cannot read or write; a path under the owner's uid but another user's design id is refused; `ai_usage` insert denied to `authenticated`, allowed to `api_app`; owner reads own usage only; admin reads all; `unsupported_features` same pattern; cascade on design delete.
- **DB adapter test:** `countToday` counts only today's rows (Cairo day? use UTC day, documented).
- Account deletion test: photos under `<uid>/` are removed (memory adapter + existing remover).

Manual test cases (draft): TC-API-339-01 upload front via signed URL with curl; 02 read with signed URL expires after 5 min; 03 another user's photo 404; 04 delete design removes objects; 05 delete account removes objects.

### Decisions to log (`docs/decisions/339-design-photos.md`)

1. Path `<userId>/<designId>/<slot>.<ext>`, so the existing account-deletion prefix rule covers photos.
2. HEIC converted in the browser; the server stores jpeg/png/webp only.
3. Bucket row created by migration for hosted environments.
4. Signed read URLs live 5 minutes.
5. `ai_usage.cost_usd` is an estimate; daily caps count by UTC day.

None is costly to reverse; the storage policies are security-sensitive and covered by pgTAP.

### Risks

- **Storage policy mistakes:** pgTAP covers cross-user and cross-design paths.
- **Service-role key use:** only inside the storage adapter, never in routes.
- **Orphan objects** when a signed upload is never used: harmless (owner prefix, deleted with design/account); `files.cleanup` job is later.

### Labels and needs

Size M, `plan:sonnet`, `build:sonnet` stay. `node scripts/needs-interactive.mjs` on the files: run below.

## Deviations

- `ai_usage` and `unsupported_features` are written by the API role through `private` security-definer functions (`record_ai_usage`, `ai_usage_count_since`, `record_unsupported_feature`) instead of table insert grants, to keep `api_app` free of table privileges (decision 339, item 6). `AiUsageRepository.countToday(userId, kind, now)` calls `ai_usage_count_since` with the UTC day start.
- No Drizzle table definitions for the two new tables: the adapter calls the functions, so nothing would use them.
- Storage REST calls live in a shared `adapters/supabase/storage-rest.ts` (also used by the files remover) instead of `@supabase/supabase-js`; the service-role usage test lists it.
- `DELETE .../photos/front` is refused with `PHOTO_FRONT_REQUIRED` while back or side photos remain; deleting a design checks ownership, removes the photos, then the row.
- `PHOTO_LIMIT_REACHED` is raised when a request lists more than 3 photos (the schema allows up to 10 entries so the code is reachable).
