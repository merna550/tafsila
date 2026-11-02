# M7 - Billing & admin

## Goal

A verified user gets 3 free patterns, each new design costs one credit while regenerations stay free, and when the credits run out she buys a single pattern, a 5-pack or a monthly plan through Paymob (card, mobile wallet or kiosk cash reference) and gets a printable receipt. Merna sees signups, trials, conversions, revenue and AI cost on an admin dashboard, can grant or deduct credits and change prices without code. Exit: the paid flow works in the Paymob sandbox and one live test payment succeeds (SRS §12).

## Scope

In:

- approved M7 screen designs;
- Paymob test-mode account and staging secrets (Merna);
- billing tables (`products`, `credit_ledger`, `subscriptions`, `payments`) with RLS and database-only writes;
- `PaymentGateway` port with a Paymob adapter and a fake adapter;
- trial grant (3 credits) and the credits API; plan limits (clients, chat per design);
- one credit for a new design, regenerations, restores and chat edits free;
- checkout, the HMAC-verified idempotent callback, manual renewal;
- credits chip, billing page with renewal reminder, pricing, paywall, checkout return, receipts;
- admin: dashboard, grant/deduct credits, payments, products and prices, shared designs (with consent) and the unsupported-feature log;
- the sandbox exit check and one live payment (Merna).

Out:

- coupons and referral credits (FR-BILL-07, priority S);
- auto-renew with card tokens, refunds through the Paymob API;
- e-mail reminders (needs an e-mail provider, M8) and Egyptian Tax Authority e-receipts (legal check at M8);
- the production project and production keys (M8, ADR-026).

## SRS IDs

FR-BILL-01..06, FR-ADM-01..04, FR-AUTH-03 (trial once per phone), FR-CHAT-06 (plan-defined quota), NFR-04 (webhook HMAC, rate limit on checkout), NFR-05 (admin sees no measurements; consent for designs), NFR-06, NFR-09 (paid step of the funnel), SRS §5 flows 3 and 4, §7 (`products`, `subscriptions`, `credit_ledger`, `payments`), §8 (`/api/billing/checkout`, `/api/billing/webhook`, `/api/me/credits`, `/api/admin/*`), §13 questions 5 and 7.

## Deliverables

- `docs/design/screens/`: M7 screens with images (#365); `docs/decisions/365-m7-scope.md`.
- Paymob test mode and staging secrets (#366); tutorial `docs/backend/tutorials/paymob.md` (#368).
- `supabase/`: billing migration, functions and pgTAP (#367); consent column (#369); `validation_failures` (#372).
- `packages/api`: gateway (#368), credits and trial (#370), checkout (#371), callback (#376), charging (#375), admin APIs (#369, #372, #373); OpenAPI and Postman in each.
- `apps/web`: credits chip and billing page (#377), pricing, paywall and return (#380), receipts (#381), admin dashboard (#378), admin credits, payments and products (#379), consent switch and admin designs (#374).
- `docs/test-cases/ui/m7-exit.md` (#382); live payment log (#383).

## Exit criteria

#382: the paid flow (trial → paywall → Paymob test mode → credits → receipt, plus a replayed callback that changes nothing) works on staging, and the fake-gateway e2e is green on CI. #383: one live payment is recorded once with its credit and receipt, then refunded.

## Dependencies

- From M1: phone verification and `private.is_trial_eligible` (ADR-26a), the mini admin, `admin_audit`, `assert_admin` and `withApiRole` (ADR-32a), account deletion (ADR-27a: payments stay for accounting with the user id set to null, decided in #367's plan). From M3: the save-version path (ADR-236, ADR-245). From M5: admin fabric pages (#320). From M6: `ai_usage` (#339) for AI cost per pattern, the chat quota (#343), analysis (#340).
- State of earlier milestones (board, 2026-11-02): M3 built, exit #254 waits for engine bugs; M4 built, exits #293-#296 are manual toile checks; M5 built, exits #322-#323 manual; M6 18 of 26 closed, #338 in progress, #342, #344, #347 (`needs:decision`), #348 open. M7 needs none of these exits; #375 touches the analyse and chat routes, so it is planned after #340 and #343 (both merged).
- Inside M7 every issue lists "Depends on #N". Critical paths:
  - #367 tables → #370 credits → #375 charging → #380 pricing and paywall → #382 exit → #383 live;
  - #368 gateway → #371 checkout → #376 callback → #380, #381;
  - #365 screens before every UI issue (#374, #377-#381);
  - #366 (Merna's test-mode keys) before #382; the decision on #383 before the live payment.
- Everything except #382 (staging) and #383 builds and tests with the **fake gateway**.

## Decisions

[ADR-365](../decisions/365-m7-scope.md):

- one credit when version 1 of a design is saved; regenerations, restores and chat edits free; analysis needs a credit but does not use it;
- ledger with expiry (pack 90 days, plan credits at the period end, trial and single never), balance computed, money in piastres;
- billing rows written only by `private` database functions; the callback is the only path that grants a purchase (HMAC, amount check, unique transaction id);
- manual renewal with an in-app reminder; one plan at a time; auto-renew later;
- plan limits as product data: Pro unlimited clients and 20 chat messages per design, others 10 and 10;
- fake gateway for CI and local, Paymob test mode on staging, no card data stored;
- refunds in the Paymob dashboard, credits removed by the admin with an audit row;
- payment receipts, not tax invoices; admin sees designs only with the user's consent.

**Open, needs Merna (`needs:decision` on #383):** the live test payment needs a live Paymob merchant account (business documents, bank account, a fee per transaction) and spends real money before production exists (ADR-022, ADR-026).

## Merna's tasks

- **Approve the M7 screens** on the design canvas (#365): every UI issue waits for them.
- **Open the Paymob account in test mode** and set the staging secrets and callback URL (#366).
- Prices are already fixed in FR-BILL-03; change them later in the admin products page (#379), not in code.
- Review the Arabic texts of pricing, paywall, billing and receipts (#377, #380, #381).
- Run the sandbox exit check on staging (#382).
- **Answer the live-payment question** on #383, then activate the live account, make the one live payment, refund it and remove the live keys.

## Risks

- **Payment security:** a forged or replayed callback could grant credits. Only the HMAC-checked callback grants, the amount is compared with the stored payment, the transaction id is unique, and the return URL grants nothing; plans are `plan:opus`.
- **Double spending:** two parallel saves or callbacks. `consume_credit` locks the user; `record_payment` is idempotent; pgTAP tests both.
- **Card data:** Paymob's hosted checkout handles cards (we never see them); only the parsed event is stored; logs and Sentry keep no bodies.
- **Free-tier limits:** callbacks are short requests on Vercel Hobby; no new paid service; Paymob has no monthly fee, only per-transaction fees on a live account (the #383 question).
- **Legal (Egypt):** receipts are payment receipts, not tax invoices; ETA e-receipts, terms of sale and the refund policy go with the M8 legal pages. The live account needs a legal entity.
- **Previews share the staging database:** a payment made on a preview is credited by the staging callback, which is correct because the rows are shared.
- **Paymob API changes:** the adapter is the only Paymob code; recorded sample callbacks in tests catch format drift.

## Issues

| Issue | Title                                                                                   | Wave |
| ----- | --------------------------------------------------------------------------------------- | ---- |
| #365  | M7 screen designs in docs/design/screens                                                | 1    |
| #366  | Merna: Paymob account in test mode and staging secrets                                  | 1    |
| #367  | Billing tables: products, credit ledger, subscriptions, payments                        | 1    |
| #368  | PaymentGateway port with a Paymob adapter and a fake adapter                            | 1    |
| #369  | Design-sharing consent and admin views of shared designs and unsupported features       | 1    |
| #370  | Credits balance API and the free trial grant                                            | 2    |
| #371  | Checkout: create a Paymob payment for a product                                         | 2    |
| #372  | Admin dashboard API: signups, trials, conversions, revenue, AI cost, failed validations | 2    |
| #373  | Admin API: grant or deduct credits, list payments, edit prices                          | 2    |
| #374  | Settings consent switch and admin pages for shared designs and unsupported features     | 2    |
| #375  | Charge one credit for a new pattern, keep regenerations free                            | 3    |
| #376  | Paymob callback: verify, record once, grant credits or a plan                           | 3    |
| #377  | Credits chip and billing page with renewal reminder                                     | 3    |
| #378  | Admin dashboard page                                                                    | 3    |
| #379  | Admin pages: user credits, payments, products and prices                                | 3    |
| #380  | Pricing, paywall and checkout return pages                                              | 4    |
| #381  | Payment receipts page                                                                   | 4    |
| #382  | M7 exit check: paid flow in the Paymob sandbox                                          | 5    |
| #383  | Merna: one live Paymob test payment                                                     | 6    |

Waves are the order the dependencies allow; `/plan-wave M7` plans every issue whose dependencies are closed. UI issues also wait for the screens (#365). If time runs short, #374 and #378 (P2) are cut first; #381 (FR-BILL-06, priority S) next.
