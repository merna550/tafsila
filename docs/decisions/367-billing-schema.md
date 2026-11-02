# ADR-367 · 2026-11-02 · billing schema

**Context:** Issue #367 adds the M7 billing tables under [ADR-365](365-m7-scope.md) items 2, 3, 5, 6, 9 and ADR-035 / ADR-26a 8 / ADR-32a 2.
**Decision:**

1. `products.code` is the primary key (stable in seed, URLs and logs).
2. A debit row points at its lot (`lot_id`); balance is the per-lot remainder of unexpired lots, so expiry needs no cron.
3. Idempotency lives in the database: unique `(reason, ref_id)` for pattern, purchase and subscription rows, and unique Paymob order and transaction ids.
4. `consume_credit` locks the user's `profiles` row, the one row every user has, so two saves queue up.
5. Errors are raised as `P0001` with a stable message code (`INSUFFICIENT_CREDITS`); the API maps them to the catalogue (#370, #375).
6. Users and admins have select only; all writes go through `private` functions executable by `api_app` and `service_role`.

**Reason:** The database enforces the money rules even if the API has a bug.
**Alternatives:** A stored balance column (drifts from the ledger); a cron to expire lots (extra moving part); a surrogate product id (unreadable in logs).
