# Plan: #368 PaymentGateway port with a Paymob adapter and a fake adapter

Plan wave M7, 2026-11-02. No dependencies. Follows [ADR-365](../decisions/365-m7-scope.md) items 7-8, ADR-012 (ports), ADR-021, and the `AI_PROVIDER=fake` pattern in `packages/config/src/env.ts`.

### Approach

A port in `packages/api/src/ports/payment-gateway.ts` and two adapters under `packages/api/src/adapters/`: `paymob/` (HTTP to Paymob's intention API, HMAC check) and `fake-payment/` (local checkout page URL, signs its own callbacks with a fixed test secret). Services and routes only see the port. Chosen in `packages/api/src/app.ts` (or the existing composition root) from `env.PAYMENT_GATEWAY`. No route here.

### Files

Create:

- `packages/api/src/ports/payment-gateway.ts`: types `PaymentMethod = "card" | "wallet" | "kiosk"`, `CreateIntentionInput { paymentId; amountPiastres; productCode; productName; method; customer: { firstName; phone; email? } }`, `Intention { checkoutUrl?: string; kioskReference?: string; gatewayOrderId: string }`, `PaymentEvent { gatewayOrderId; transactionId; amountPiastres; currency: "EGP"; outcome: "paid" | "failed" | "pending" | "refunded"; method; paymentId }`, interface `PaymentGateway { createIntention(input): Promise<Intention>; verifyCallback(fields: Record<string,string>, hmac: string): PaymentEvent | { refused: "HMAC_MISMATCH" | "BAD_PAYLOAD" } }`. JSDoc per type.
- `packages/api/src/adapters/paymob/paymob-gateway.ts`: `createIntention` → `POST {base}/v1/intention/` with `Authorization: Token <secret>`, `amount` (piastres), `currency: "EGP"`, `payment_methods: [integration id for the method]`, `items`, `billing_data`, `special_reference: paymentId`, `notification_url`/`redirection_url` from env; returns the unified checkout URL `{base}/unifiedcheckout/?publicKey=…&clientSecret=…` (kiosk: the reference from the response). Uses an injected `fetch` (tests pass a stub). Timeout 10 s; non-2xx → `DomainError("PAYMENT_GATEWAY_UNAVAILABLE")`.
- `packages/api/src/adapters/paymob/hmac.ts`: `PAYMOB_HMAC_FIELDS` (the documented transaction-callback field order, as a constant with the docs link), `computeHmac(fields, secret)` (HMAC-SHA512 hex over the concatenated values), `verifyHmac` with `crypto.timingSafeEqual`.
- `packages/api/src/adapters/paymob/parse-callback.ts`: maps Paymob's transaction object to `PaymentEvent` (success/pending/is_refunded/is_voided → outcome; `source_data.type` → method; amount `amount_cents` → piastres); drops every `source_data.pan`/card field; returns `BAD_PAYLOAD` for missing ids or currency ≠ EGP.
- `packages/api/src/adapters/fake-payment/fake-gateway.ts`: `createIntention` → `checkoutUrl = ${APP_URL}/{locale}/dev/fake-checkout?payment=<id>` (the page itself is #380's concern; a URL is enough here); `signTestCallback(event)` helper that produces fields + HMAC with `FAKE_PAYMENT_SECRET`, reusing `hmac.ts`; `verifyCallback` uses the same code path as Paymob (so the e2e exercises the real HMAC check).
- Tests next to each file: `hmac.test.ts` (recorded sample callback from Paymob docs/test mode stored as a fixture `__fixtures__/paymob-callback.json` with fake values: accepted; one field changed → refused; wrong secret → refused; constant-time compare used), `parse-callback.test.ts` (paid, failed, pending, refunded, kiosk, wallet; currency USD → BAD_PAYLOAD; output has no `pan`/`card` keys), `paymob-gateway.test.ts` (stub fetch: body has amount in piastres, EGP, integration id per method, auth header; non-2xx → error; the secret never appears in thrown messages), `fake-gateway.test.ts` (round trip: sign → verify → same event).
- `docs/backend/tutorials/paymob.md`: test mode, the three integrations, callback and redirect URLs (staging), where each secret goes (`_STAGING` repo secrets + Vercel env), Paymob test cards and wallet numbers, how to replay a callback.

Change:

- `packages/config/src/env.ts` (+ `env.test.ts`): `PAYMENT_GATEWAY: z.enum(["fake","paymob"]).default("fake")`, `PAYMOB_MODE: z.enum(["test","live"]).default("test")`, `PAYMOB_BASE_URL` default `https://accept.paymob.com`, `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_INTEGRATION_ID_CARD|WALLET|KIOSK` (all optional strings; required when `PAYMENT_GATEWAY=paymob`), `FAKE_PAYMENT_SECRET` (default fixed dev value); in production refuse `PAYMENT_GATEWAY=fake` and refuse `PAYMOB_MODE=test` (mirrors the `AI_PROVIDER` check at line ~154). Remove the unused `PAYMOB_API_KEY`.
- `.env.example`, `.github/ci.env` (`PAYMENT_GATEWAY=fake`), `docs/backend/environments.md` (or the existing env table).
- Composition root (where `AI_PROVIDER` picks its adapter): pick the gateway; no route uses it yet.
- `docs/SRS.md` FR-BILL-04 wording only if the builder confirms Paymob's cash option is "kiosk / Aman" rather than Fawry (from Paymob's current docs; note the source in the decision file).

### Data / API

No schema, no route. Env variables as above.

### Tests

Listed per file. `pnpm quality` green. A log test: the adapter's log line for a callback contains ids and outcome only (spy on the logger).

### Decisions (build writes `docs/decisions/368-payment-gateway.md`)

1. Intention API + unified checkout (current Paymob flow), not the legacy 3-step order/payment-key API.
2. HMAC field list as a named constant with its docs source; constant-time compare.
3. Fake gateway shares the HMAC code so CI exercises verification.
4. `PAYMOB_MODE=live` only in production; `test` refused there; `fake` refused in production.
5. Parsed event only; raw Paymob payload is never stored or logged (card fields dropped at parse).

### Risks

- Paymob's field order or API shape differs from memory: the builder reads Paymob's current developer docs (web) and records the URL; tests use a recorded test-mode sample when #366 provides keys, a docs sample until then.
- Kiosk flow returns a reference, not a URL: the port allows either.

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no (no live keys needed; staging keys come with #366).

---

_Generated by [Claude Code](https://claude.ai/code)_

## Deviations

- `PAYMOB_MODE` keeps `sandbox | live` (not `test`), see ADR-368 item 4.
- `verifyCallback` takes the nested transaction object (`obj`), not a flat map; `APP_URL` added; all six `PAYMOB_*` keys required when `PAYMENT_GATEWAY=paymob`.
- Shared verifier `transaction-verifier.ts` added; the Paymob docs were unreachable, so the HMAC order is unverified against live docs (ADR-368 item 2).
- Plan said `DomainError`; the repo's class is `AppError` with new code `PAYMENT_GATEWAY_UNAVAILABLE` (docs/errors.md).
