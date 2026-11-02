# Design photos: upload, read and delete

How a garment photo gets from the browser into the private `design-photos` bucket (issue #339, [decision 339](../../decisions/339-design-photos.md)).

## The flow

1. `POST /api/designs/{id}/photos` with `{ "photos": [{ "slot": "front", "contentType": "image/jpeg", "sizeBytes": 1800000 }] }`. The API checks the design is yours (404 otherwise), the type (JPEG, PNG, WebP), the size (10 MB) and that a `front` photo exists or is in the request. It records the paths on `designs.photo_paths` and returns one signed upload URL per photo.
2. The browser sends the file straight to `signedUrl` with `PUT`. The file never passes through the API.
3. `GET /api/designs/{id}/photos` returns a 5-minute signed read URL for each photo that was really uploaded.
4. `DELETE /api/designs/{id}/photos/{slot}` removes the object and the path. `front` can only be removed last.

Deleting the design removes its objects first; deleting the account removes everything under `<userId>/`.

## Where things live

- Path: `<userId>/<designId>/<slot>.<ext>` ([`domain/design-photos.ts`](../../../packages/api/src/domain/design-photos.ts)).
- Port `PhotoStorage`, adapter `adapters/supabase/photo-storage.ts` (the service role key stays in `storage-rest.ts`), memory fake for tests.
- Storage policies and the new tables: `supabase/migrations/20261101120000_design_photos_ai_usage.sql`; pgTAP in `supabase/tests/database/design-photos.test.sql`.
- `ai_usage` and `unsupported_features` are written by the API role through `private` functions; `AiUsageRepository.countToday` counts by UTC day for the daily caps.

## Try it

```bash
curl -s -X POST "$API/api/designs/$ID/photos" -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"photos":[{"slot":"front","contentType":"image/jpeg","sizeBytes":120000}]}'
curl -X PUT --data-binary @front.jpg -H 'content-type: image/jpeg' "<signedUrl from the answer>"
```

Seed data has no photos (they are private user files); see [seed data](../seed-data.md).
