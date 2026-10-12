# ADR-29a · 2026-10-11 · Clients and measurement sets API

**Context:** Issue #29 adds the first real data endpoints (`/api/clients`, `/api/measurements`) on top of the M1 schema (#24), the engine's validation (#28) and API auth (#25).

**Decision:**

1. Paging is `limit` + `offset` with `total` (small lists, cheap to change to cursors later); order `created_at desc, id desc`.
2. `MEASUREMENTS_INVALID` is a new 422 code, separate from `VALIDATION_FAILED` (shape errors). `details.fields` carries the English text per measurement key, `details.issues[]` carries the engine issues in both languages so the UI picks the language.
3. Warnings are computed on every read and write and are never stored (the rules may change; stored warnings would go stale).
4. `withUser` reuses the claims verified by `requireAuth` (one verification per request); it only refuses a context without a matching `sub`.
5. A missing `DATABASE_URL` wires rejecting repositories (INTERNAL_ERROR), never memory ones, so production cannot fall back to memory silently.
6. `PlanLimits` exposes `canAddClient` only (YAGNI); M7 adds more methods.
7. The API connects as `api_app` everywhere (local, CI, staging); the `postgres` URL in `.github/ci.env` and `.env.docker.example` is replaced because it bypasses RLS.
8. No standard-size endpoint: the client sends full `measurements` (use `fromStandardSize`); `sizeLabel` is only a label.
9. Postman: the generated folders for these routes are replaced by a scripted journey (`postman/journey.json`) that chains ids, plus ERR cases in `postman/err-cases.json`.

**Reason:** Follows the plan in the issue comment. The Drizzle files live directly in `adapters/supabase/` (`schema.ts`, `with-user.ts`) because the lint rule forbids three-level relative imports of ports.

**Alternatives:** Cursor paging (more code for lists of dozens), storing warnings (stale), memory fallback without `DATABASE_URL` (unsafe in production).
