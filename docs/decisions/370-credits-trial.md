# ADR-370 · 2026-11-03 · credits read model and the free trial

**Context:** Issue #370 adds `GET /api/me/credits`, `GET /api/billing/products` and the 3-credit trial under [ADR-365](365-m7-scope.md) items 2-4 and 6 and [ADR-367](367-billing-schema.md).
**Decision:**

1. The trial is granted by `private.grant_trial` in the same `withApiRole` transaction as `confirm_phone`; the row lock on the user's `trial_phones` row and `trial_granted_at` make it idempotent, so a failed grant rolls the verification back.
2. `TRIAL_CREDITS = 3` is a domain constant passed to SQL (the trial is not sold, so it is not product data).
3. One function, `private.credit_lots`, holds the expiry math; `credit_balance` and `credit_summary` read it.
4. `PlanLimits` returns values (`maxClients`, `chatPerDesign`); the client rule lives in `domain/plan-limits.ts`. No active plan (none, or `current_period_end` past) gives 10 clients and `CHAT_MESSAGES_PER_DESIGN` (default 10) messages.
5. `GET /api/billing/products` needs sign-in; a public pricing page can open it at M8.
6. A user verified before M7 gets the trial lazily on the first credits read (`ensureTrial`, event `trial_granted { source: "lazy" }`); #375 calls it before analyse and version 1.

**Reason:** Money rules stay in the database and run once; the lazy path recovers every user verified before the deploy.
**Alternatives:** A cron or backfill migration for old users (extra moving part, same result); granting from the API after `confirm_phone` in a second transaction (a crash between the two loses the trial).
