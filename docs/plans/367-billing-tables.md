## Plan: #367 Billing tables: products, credit ledger, subscriptions, payments

Plan wave M7, 2026-11-02. No dependencies. Follows [ADR-365](../decisions/365-m7-scope.md) items 2, 3, 5, 6, 9 and ADR-035 / ADR-26a 8 / ADR-32a 2 (writes only through `private` security-definer functions).

### Approach

One migration in the style of `20261011120000_m1_schema.sql` and `20261014120000_admin_functions.sql`: tables with RLS (owner select, admin select via `is_admin()`, **no** insert/update/delete grant to `authenticated`), and a small set of `private` functions that are the only writers, `execute` granted to `api_app` only. Balance is computed from the ledger, never stored.

### Files

Create:

- `supabase/migrations/20261103120000_billing.sql`
  - `products`: `code text pk` (`single`, `pack5`, `hobby`, `pro`), `kind` check (`single|pack|subscription`), `price_piastres int > 0`, `credits int > 0`, `credit_days int null` (null = no expiry), `period_days int null` (subscriptions only), `max_clients int null` (null = unlimited), `chat_per_design int not null`, `active bool`, `name_ar`, `name_en`. Seeded with the four FR-BILL-03 rows (prices from the SRS, in piastres). Readable by `anon` and `authenticated` (active rows), written only by admin functions (#373).
  - `credit_ledger`: `id`, `user_id → profiles on delete cascade`, `delta int <> 0`, `reason` check (`trial|purchase|subscription|pattern|admin|refund`), `ref_id text null` (payment id, design id, audit id), `expires_at timestamptz null` (grants only), `lot_id uuid null references credit_ledger(id)` (debits only; the grant it draws from), `created_at`. Checks: grants have `delta > 0 and lot_id is null`; debits `delta < 0 and lot_id is not null and expires_at is null`. Index `(user_id, expires_at)`. Unique `(reason, ref_id)` where `reason in ('pattern','purchase','subscription')` so a design is charged once and a payment granted once.
  - `subscriptions`: `id`, `user_id`, `product_code → products`, `status` check (`active|expired|cancelled`), `current_period_end`, `created_at`; partial unique index: one `active` row per user.
  - `payments`: `id uuid`, `user_id`, `product_code`, `amount_piastres`, `currency text default 'EGP' check = 'EGP'`, `status` check (`pending|paid|failed|refunded`), `method` check (`card|wallet|kiosk|fake`), `paymob_order_id text unique null`, `paymob_transaction_id text unique null`, `raw jsonb null` (parsed event only), `created_at`, `paid_at`.
  - Functions (all `security definer`, `set search_path = ''`, in `private`, `execute` to `api_app` only):
    - `credit_balance(p_user)` → int: sum of grants not expired minus debits drawn from them (per lot: `greatest(grant - debited, 0)` for unexpired lots).
    - `grant_credits(p_user, p_delta, p_reason, p_ref, p_expires_at)` → ledger row id; refuses `p_delta <= 0`; idempotent on the unique `(reason, ref_id)` (returns the existing id).
    - `consume_credit(p_user, p_design)` → lot id: `select … for update` on the user's `profiles` row (serialises two saves), picks the open lot that expires first (nulls last, then oldest), inserts the debit with `reason 'pattern'`, `ref_id = design id`; raises `INSUFFICIENT_CREDITS` (SQLSTATE `P0001`, message code) when the balance is 0; a second call for the same design returns the existing debit (no double charge).
    - `record_payment(p_payment, p_transaction_id, p_status, p_raw, p_paid_at)` → `{ changed bool, status }`: updates a `pending` row once; the same transaction id again changes nothing.
    - `start_subscription(...)` is **not** here (it belongs to #376 with fulfilment).
- `supabase/tests/database/billing.test.sql` (pgTAP, fixtures A, B, admin C like `rls.test.sql`).

Change:

- `packages/api/src/adapters/supabase/schema.ts` (+ `schema.test.ts`), `database.types.ts` (regenerated; hand-edit only if Docker is missing, as #237 did).
- `supabase/seed.sql` + `docs/backend/seed-data.md`: seed user with a trial grant (3, no expiry) and a pack grant (5, expires in 90 days) and one debit.
- `docs/SRS.md` §7 rows for the four tables; `docs/backend/README.md` one line "billing writes only through private functions".

### Data / API

Schema and functions only. No routes (#370, #371, #376). No OpenAPI change.

### Tests (pgTAP)

- A reads only A's ledger/payments/subscriptions; A cannot insert/update/delete any billing table (`42501`); C (admin) reads all; `api_app` without `set role` reads nothing.
- Balance ignores an expired grant; a debit picks the earliest-expiring open lot (expiring pack before the non-expiring trial).
- Two debits on balance 1: run `consume_credit` twice for different designs in one test with an advisory check: the second raises `INSUFFICIENT_CREDITS` and the balance is 0 (the row lock is proven by a `pg_locks` assertion or by the serial order; a true two-session race is out of pgTAP's reach, noted in the test file).
- Same design twice → one debit only. Same `(purchase, payment id)` grant twice → one row.
- `record_payment` twice with the same transaction id → second returns `changed = false`; a different payment cannot reuse that transaction id (`unique_violation`).
- Products seeded with 4 rows, prices in piastres.

Manual test cases: `docs/test-cases/db/367-billing.md` TC-DB-367-01..03 (`db:reset`, seed balance visible, admin read).

### Decisions (build writes `docs/decisions/367-billing-schema.md`)

1. Product `code` as the primary key (stable in seed, URLs and logs).
2. Debit rows point at their lot (`lot_id`); balance = per-lot remainder, so expiry needs no cron.
3. Idempotency in the database: unique `(reason, ref_id)` for pattern/purchase/subscription and unique Paymob ids.
4. The row lock is on `profiles`, the one row every user has.
5. Error codes raised as `P0001` with a stable message code, mapped by the API to the catalogue (#370, #375).

### Risks

- FIFO over expiring lots in SQL is easy to get wrong: pgTAP covers grant-only, mixed and fully spent lots.
- Docker missing locally: CI's `db-reset` job runs pgTAP; hand-edited `database.types.ts` must match (as in #237).

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no.

---

_Generated by [Claude Code](https://claude.ai/code)_

## Deviations

None.
