---
paths:
  - "supabase/**"
  - "packages/api/src/adapters/**"
---

# Database and adapters

- Only `packages/api/src/adapters/supabase/` contains queries; services use repository ports.
- Every user-owned table has Row Level Security enabled with an owner policy in the same migration.
- Schema changes are new files in `supabase/migrations/`; an applied migration is never edited.
- `pattern_versions` rows are immutable and credits are an append-only ledger.
- A migration that adds records needed for testing also updates `supabase/seed.sql` and `docs/backend/seed-data.md`.
- Generated DB types are imported by adapters only.
