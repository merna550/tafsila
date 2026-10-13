# ADR-32b · 2026-10-14 · Mini admin web screens (Part B of #32)

Issue: #32 (Part B) · Follows [32a](32a-mini-admin-api.md)

1. **Own components, no admin framework** (Merna): `StatTile` and `SegmentedControl` join `packages/ui` with unit tests. No Storybook stories yet: visual baselines need Docker (lesson of #27); stories come with the PR that regenerates baselines.
2. **Gate in three layers.** The access guard sends signed-out visitors on `/admin` to sign-in. The `(admin)` layout reads the `user_role` claim of the session token on the server (`getSessionRole`, no network call, up to one hour old) and calls `notFound()` for non-admins, so the area is not advertised. The API (403) and the database re-check the role: they are the real boundary.
3. **Design-system 404** at `app/[locale]/not-found.tsx` (none existed).
4. **Admin link** in `AppNav` through an optional `isAdmin` prop set by the server layout.
5. **Size order** is garment order (S, M, L, XL, XXL), not the JSON key order the database returns.
6. **Grid cells are cm text** parsed with the measurements feature's own parser; a cell is "changed" when its value differs, not its text ("92" equals "92.0"). Engine errors block saving per size; warnings are listed and saved.
7. **CSV without a dependency**: header `measurement,S,M,...`, camelCase keys, cm; accepts a BOM, quotes, `\r\n`, semicolon files with a decimal comma and Arabic-Indic digits. Import shows a preview of every problem (including engine errors) and then saves through the same `PUT`, with a chart name so the "temporary" banner goes away.
8. **Shared code moved, not copied:** relative-time formatting moved from `features/clients/model` to `shared/format` (the admin list needs it too); the measurements feature gets a second public entry `model.ts` (pure, no React) for its field groups and parsers.
9. **Real chart values** are loaded by Merna through the import afterwards, so "real chart loaded" is not an acceptance criterion of this PR.

**Not run here (no Docker, Node 22.22.0):** e2e (`e2e/admin.spec.ts`), visual baselines. CI runs e2e.
