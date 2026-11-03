# ADR-368 · 2026-11-02 · payment gateway port, Paymob adapter, fake adapter

**Context:** Issue #368 (FR-BILL-04) under [ADR-365](365-m7-scope.md) items 7-8 and ADR-012. Merna has no Paymob account yet (#366), so nothing here needs a real key.
**Decision:**

1. Paymob's **intention API with unified checkout** (`POST /v1/intention/`, secret key in `Authorization: Token`), not the legacy three-step order and payment-key flow.
2. The HMAC-SHA512 field list is the named constant `PAYMOB_HMAC_FIELDS` (alphabetical, dotted paths for nested objects) and the compare uses `crypto.timingSafeEqual`. The Paymob developer docs were not reachable from the build session, so the order is from the documented list as remembered and the fixture is a docs-shaped sample with invented values; replace both checks with a recorded sandbox callback when #366 gives keys.
3. The fake gateway signs and verifies with the **same code** as Paymob (`transaction-verifier.ts`), so CI and e2e run the real HMAC check. Its secret defaults to a public dev value; production refuses `PAYMENT_GATEWAY=fake`.
4. `PAYMOB_MODE` keeps its existing values `sandbox | live` (the plan said `test`; the name `sandbox` is already in WORKFLOW and the env files). Production refuses `sandbox`. `PAYMOB_*` keys are optional except when `PAYMENT_GATEWAY=paymob`, where all six are required (so production needs them through that rule). `PAYMOB_API_KEY` is removed; `APP_URL` is added for the callback and redirect URLs.
5. The port takes the parsed callback `obj` (not a flat map) and returns a `PaymentEvent` or a refusal. Card fields (`source_data.pan` and the rest) are dropped at parse time; the log line holds ids and outcome only; the raw payload is never stored or logged.
6. Cash method: the kiosk (Aman/Masary reference), already checked on 2026-10-07 in the handbook card; Fawry is not promised. The port calls it `kiosk`. SRS FR-BILL-04 wording updated.

**Reason:** Routes never see Paymob, CI never needs a key, and a signature bug cannot hide behind a fake that skips the check.
**Alternatives:** Legacy order/payment-key API (older, more calls); a fake that skips HMAC (hides bugs); making all Paymob keys always required (blocks CI and local work).
