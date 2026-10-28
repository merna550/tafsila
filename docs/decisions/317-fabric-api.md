# ADR-317 · 2026-10-28 · Fabric tables and API

## Context

M5 stores the fabric catalogue and rules in the database so the admin can change them without a deploy, stores the last fabric calculation per version, and serves recommendations ([ADR-312](312-m5-scope.md) items 5, 6 and 8). The plan left a few details open: the ids, the verb of the save route, how the seed stays equal to the package, and how the draft status shows.

## Decision

1. **Ids and columns.** `fabrics.id` and `fabric_rules.id` are the package slugs (text, kebab-case check), so rules and the migration seed refer to stable ids. The JSON columns hold the package types as they are: `properties`, `care_notes`, `condition` (the rule's `when`), `required_properties` (its `effect`), `reason`. The adapter maps these two names.
2. **`PUT /api/versions/:id/fabric`, not `POST`.** One row is kept per version and options (unique on the version and a SHA-256 of the options), and the last save replaces it. `PUT` says that. `GET` returns the latest saved calculation (no options query in v1; the screen asks for the latest).
3. **The server checks the result, not the layout.** The browser computes the layout; the server checks the shape, that each length is a positive multiple of 0.1 m, one entry per fabric kind and at most 200 placements per kind. A wrong result gives 422 `FABRIC_CALC_INVALID` with the field path, so the body of `result` is typed loosely in the OpenAPI document and parsed in the use case.
4. **Seed by migration, from a generator.** `packages/fabric-kb/src/seed-sql.ts` renders the inserts and the migration ends with them; a unit test compares the file with the generator output (same pattern as [ADR-31a](31a-measurement-form.md) and the size chart).
5. **Draft flag per row.** `is_draft` is stored on every row (true for the seed). The recommend response has `isDraft` when any catalogue or rule row is a draft, so the UI can say so until Merna reviews. A fabric or rule an admin adds is not a draft unless sent as one.
6. **Admin writes follow [ADR-32a](32a-mini-admin-api.md).** The route needs the admin role, RLS allows writes only to admins, and each write and its `admin_audit` row (`fabric.created|updated|deleted`, `fabric_rule.*`, target = the id, `before` and `after`) run in one `withUser` transaction. A write that touches no row (a stale admin token) throws `FORBIDDEN` and writes no audit. A duplicate id is 409 `FABRIC_ID_TAKEN`.
7. **Rule validation.** A rule from an admin is checked with `ruleProblems` from `@tafsila/fabric-kb`; an update is checked after merging with the stored rule. An unknown path, value or operator gives 422 `FABRIC_RULE_INVALID` with `details.fields["when.<index>"]`.
8. **Calculations are owner-only.** `fabric_calcs` carries `owner_id` with a composite foreign key to the version (so a calculation cannot point at another user's version), an owner policy and an admin read policy. The save also filters by owner, so an admin cannot write a calculation for another user.
9. **Only the changed fields are patched.** `PATCH` replaces `properties`, `careNotes`, `when`, `effect` and `reason` whole when sent; there is no deep merge.

## Reason

These keep the data one-to-one with the tested package, make the save idempotent, keep the seed from drifting and reuse the audit pattern of the size chart. All are cheap to change before the beta (no production data, [ADR-026](../DECISIONS.md)).

## Alternatives

- `POST` that appends a row per save: the table would grow with every slider change and "the last calculation" would need a query by date.
- Separate columns for each fabric property: a new property would need a migration; the package type is the contract.
- Seeding from `supabase/seed.sql`: staging would not have the catalogue ([ADR-312](312-m5-scope.md) item 6).
