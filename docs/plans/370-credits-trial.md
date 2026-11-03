## Plan: #370 Credits balance API and the free trial grant

Plan wave M7, 2026-11-02. Depends on #367 (builds on its `private.credit_balance`, `grant_credits`, tables and `schema.ts` mirror). Follows [ADR-365](../decisions/365-m7-scope.md) 2-4 and 6, ADR-26a 7-8, ADR-035, ADR-030. Planned together with #375 (it reuses the `Billing` port and `ensureTrial` from here).

### Approach

- **Trial in SQL, once:** new `private.grant_trial(p_user uuid, p_credits int) returns boolean`: locks the caller's `trial_phones` row (`for update`), returns false unless `private.is_trial_eligible(p_user)`, else `private.grant_credits(p_user, p_credits, 'trial', null, null)` + `trial_granted_at = now()`, returns true. The lock + `trial_granted_at` make it idempotent; one hash row per number keeps it once per phone (a second account or a recreated account already fails `confirm_phone` with `PH001`).
- **Verify transaction:** the phone adapter's `confirm` runs `confirm_phone` then `grant_trial` in the **same** `withApiRole` transaction; `ConfirmResult` gets `trialGranted`. The number 3 is `TRIAL_CREDITS` in `domain/billing.ts`, passed as `p_credits`.
- **Lazy grant:** `services/billing-shared.ts` `ensureTrial(deps, userId)` calls `billing.grantTrial(userId, TRIAL_CREDITS)` and captures `trial_granted { source: "lazy" }` when true. `GET /api/me/credits` calls it first (#375 also calls it before analyse and version 1).
- **One read function:** `private.credit_summary(p_user) returns jsonb` `{ balance, lots: [{ remaining, expires_at }], plan: { code, period_end, max_clients, chat_per_design } | null }`. Refactor #367's per-lot remainder into `private.credit_lots(p_user)` (set-returning, unexpired lots with remaining > 0) and make `credit_balance` = `sum(remaining)` over it, so the FIFO/expiry logic lives once. Plan = `subscriptions` row `status='active' and current_period_end > now()` joined to `products` (no cron needed for expiry).
- **Plan limits:** `PlanLimits` becomes `limits(ctx) → { maxClients: number | null; chatPerDesign: number }` (drop `canAddClient`; the rule `canAddClient(limits, count)` moves to `domain/plan-limits.ts`, used by `create-client`). No active plan → `DEFAULT_PLAN_LIMITS = { maxClients: 10, chatPerDesign: jobsConfig.chatMessagesPerDesign (10) }` (ADR-365 6). Delete `adapters/plan/unlimited-plan-limits.ts`.
- **Products:** `GET /api/billing/products` (signed-in) reads active `products` through `withUser` (they are readable by `authenticated`), ordered by price.

### Files

Create:

- `supabase/migrations/20261104120000_credits_trial.sql`: `private.credit_lots`, `credit_summary`, `grant_trial`, `plan_limits(p_user)` (returns `max_clients`, `chat_per_design` or nulls); `credit_balance` rewritten on `credit_lots`; `execute` to `api_app` only.
- `supabase/tests/database/credits_trial.test.sql` (pgTAP).
- `packages/schemas/src/billing.ts` (+ test, export in `index.ts`): `creditsResponseSchema` `{ balance, grants: [{ credits, expiresAt: string | null }], plan: { code, periodEnd, renewSoon } | null, limits: { maxClients: number | null, chatPerDesign } }`, `productSchema` `{ code, kind, pricePiastres, credits, creditDays, periodDays, maxClients, chatPerDesign, nameAr, nameEn }`, `productsResponseSchema { items }`, with `.openapi({ example })`.
- `packages/api/src/domain/billing.ts` (+ test): `TRIAL_CREDITS = 3`, `RENEW_SOON_DAYS = 7`, `isRenewSoon(periodEnd, now)`, `toGrants(lots)` (sorted by expiry, nulls last).
- `packages/api/src/domain/plan-limits.ts` (+ test): `DEFAULT_PLAN_LIMITS`, `canAddClient(limits, count)`.
- `packages/api/src/ports/billing-repository.ts`: `BillingRepository { summary(userId); grantTrial(userId, credits): Promise<boolean>; listProducts(ctx) }` with `CreditSummary` / `Product` types.
- `packages/api/src/adapters/supabase/billing-repository.ts` (+ `billing-repository.db.test.ts`), `adapters/supabase/plan-limits.ts` (calls `private.plan_limits`, applies the default).
- `packages/api/src/adapters/memory/billing-repository.ts`: in-memory ledger with the same FIFO/expiry rules, implements `BillingRepository` and `PlanLimits`; reads eligibility from the memory phone store; option `startingCredits` (see Risks).
- `packages/api/src/services/billing-shared.ts` (`ensureTrial`), `services/get-credits.ts`, `services/list-products.ts`, `services/billing.test.ts`.
- `packages/api/src/routes/billing.ts` (+ `billing.test.ts`): `GET /api/me/credits`, `GET /api/billing/products`, `createRoute` + `errorResponses`.
- `docs/test-cases/api/370-credits-trial.md`, `docs/backend/tutorials/credits-and-trial.md` (how the trial and the lazy grant work, how to give a local user credits).

Change:

- `ports/phone-verification-repository.ts` (`confirm(..., trialCredits)`, `ConfirmResult.trialGranted`), `adapters/supabase/phone-verification-repository.ts`, `adapters/memory/phone-verification-repository.ts`, `services/verify-phone.ts` (event `trial_granted { source: "verify" }`), `packages/schemas/src/phone.ts` only if the verify response exposes `trialGranted` (add it, optional for old clients).
- `ports/plan-limits.ts`, `services/create-client.ts`, `container.ts`, `test-support/memory-app.ts`, `openapi/document.ts`, `dev/test-server.ts`, `adapters/supabase/rejecting-repositories.ts`, `app.ts` (mount).
- `packages/schemas/src/analytics-events.ts` (+ test): `trial_granted { source: "verify" | "lazy" }`, no other properties.
- OpenAPI/Postman via `pnpm api:openapi && pnpm api:postman`; `postman/journey.json` step "credits after verify"; `postman/err-cases.json` `ERR GET /api/me/credits` without token → 401.
- `supabase/seed.sql` + `docs/backend/seed-data.md`: every seed user phone-verified with `trial_granted_at` set and a trial grant; one user with an active `hobby` subscription ending in 5 days (shows `renewSoon`).
- `docs/SRS.md` §8 rows (`/api/me/credits`, `/api/billing/products`), FR-BILL-02 note (grant done); `docs/errors.md` unchanged (no new code).

### Data / API

- Migration above (functions only, no table change).
- `GET /api/me/credits` → 200 `creditsResponseSchema`; 401.
- `GET /api/billing/products` → 200 `{ items: Product[] }`; 401.
- Verify phone response: `+ trialGranted: boolean`.

### Tests

- pgTAP: `grant_trial` twice → one ledger row, second returns false; unverified user → false; deleted user's number re-verified by a new account → `PH001`, no grant; `credit_summary` with an expired pack lot, a partly spent trial lot and an active plan; plan with `current_period_end` in the past → null; `credit_balance` equals the sum of `credit_lots` after the refactor; `authenticated` cannot execute any of them (`42501`).
- Service (memory): verify → balance 3 and `trial_granted` captured once; verify on a second account with the same number → `PHONE_ALREADY_USED`, balance 0; pre-M7 verified user (eligible, no grant) → first `getCredits` grants 3, second read grants nothing; `renewSoon` false at 8 days, true at 7 and 1; Pro → `maxClients: null`; no plan → 10/10; `canAddClient` false at 10 with no plan, true at 500 on Pro.
- Route: 200 shape for both routes; 401 without token; user A never sees B's balance (B's grant does not change A's response); products only `active` rows.
- DB adapter test (`*.db.test.ts`): verify + grant in one transaction (force `grant_trial` to fail with a test hook → `phone_verified_at` stays null).
- Manual TC-API-370-01..04: verify then credits (3), lazy grant for a seed user with `trial_granted_at` cleared, Hobby user `renewSoon`, products list.

### Decisions (build writes `docs/decisions/370-credits-trial.md`)

1. Trial granted by `private.grant_trial` in the same `withApiRole` transaction as `confirm_phone`; the row lock on `trial_phones` + `trial_granted_at` make it idempotent.
2. `TRIAL_CREDITS = 3` is a domain constant passed to SQL (not product data: the trial is not sold).
3. One `credit_lots` function holds the expiry/FIFO math; balance, summary and #375's charge use it.
4. `PlanLimits` returns values; the client rule moves to the domain. No active plan → 10 clients, `CHAT_MESSAGES_PER_DESIGN` (default 10) messages.
5. `GET /api/billing/products` needs sign-in (pricing lives in the app; a public pricing page can open it at M8).
6. Lazy grant also runs before analyse and before version 1 (#375), so a pre-M7 user is never refused before her first credits read.

### Risks

- Existing tests and e2e save versions without credits once #375 lands: the memory billing adapter takes `startingCredits` (default 0); `createMemoryApp` and `dev/test-server.ts` pass a large value, new billing tests pass 0.
- `confirm` now writes billing rows: a `grant_trial` failure rolls back the verification; covered by the DB test, and the lazy path recovers any user verified between the migration and the deploy.
- Users over 10 clients keep them and only adding is refused (ADR-365 6); seed data stays under 10 per user.

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no.

## Deviations

- `startingCredits` is a `createMemoryApp` option (default 0), not passed by `dev/test-server.ts`: no route spends credits yet; #375 sets it where saving versions needs credits.
- `PlanLimits` and `BillingRepository` are both implemented by one `MemoryBilling` object; the memory phone repository notifies it (`onTrialGranted`) so the trial lot appears in the same step as the verification.
- `scalar()` moved from the phone adapter to `adapters/supabase/scalar.ts` (shared by the phone and billing adapters).
- `private.consume_credit` keeps its own copy of the FIFO pick (it must lock and order lots); `credit_lots` is used by balance and summary now, and #375 can switch the charge to it.
- The DB test forces a failing grant with `trialCredits = 0` (`grant_credits` rejects it) instead of a test hook.
