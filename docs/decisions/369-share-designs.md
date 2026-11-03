# ADR-369 · 2026-11-03 · design-sharing consent and admin views of shared designs

**Context:** Issue #369 (FR-ADM-03) under [ADR-365](365-m7-scope.md) item 11 and ADR-32a (admin functions in `private`, `assert_admin`, audit rows, column checks). Admins need to see designs and unsupported features for product research without seeing private data.
**Decision:**

1. Consent is one boolean `profiles.share_designs` (default false) with `share_designs_changed_at` set by a trigger. The owner changes it through the existing `PATCH /api/profile` (`shareDesigns`) by a column-level grant; every other profile column stays non-updatable. No history table in M7.
2. `private.admin_shared_designs` lists only designs of consenting owners, with the spec of the current version, title, category, owner display name and photo paths. It never returns measurements, measurement set ids, clients or notes. The API signs the photo paths for 5 minutes.
3. `private.admin_unsupported_features` returns the text, garment category and time only: no user id and no design id.
4. Each admin list call writes one `admin_audit` row (`admin.designs.list`, `admin.unsupported.list`), so the functions are `volatile`. Non-admins get `42501`, mapped to `FORBIDDEN`.
5. Seed: `pro@tafsila.test` consents and has one design; the default seed user does not.

**Consequences:** Withdrawing consent hides the designs at the next call. Admin screens (a later issue) only consume these two routes.
