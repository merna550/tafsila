# Test cases — Payment gateway

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #368                        |
| SRS          | FR-BILL-04, NFR-04          |
| Area         | api                         |
| Last updated | 2026-11-02 (by PR for #368) |

## Test data

No database. The recorded sample callback is `packages/api/src/adapters/paymob/__fixtures__/paymob-callback.json`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                               | Priority | Preconditions        | Steps                                     | Expected result                                  | Automated by                                       | dev | staging |
| ------------- | ----------------------------------- | -------- | -------------------- | ----------------------------------------- | ------------------------------------------------ | -------------------------------------------------- | --- | ------- |
| TC-API-368-01 | Sample callback accepted            | High     | -                    | Verify the fixture with its secret        | Event: 15000 piastres, EGP, paid, card           | `paymob/paymob-gateway.test.ts`                    | ✅  | ⬜      |
| TC-API-368-02 | Changed field or secret refused     | High     | -                    | Edit one field, or use another secret     | `HMAC_MISMATCH`                                  | `paymob/hmac.test.ts`                              | ✅  | ⬜      |
| TC-API-368-03 | USD or missing id refused           | High     | -                    | Parse a USD payment                       | `BAD_PAYLOAD`                                    | `paymob/parse-callback.test.ts`                    | ✅  | ⬜      |
| TC-API-368-04 | Fake round trip                     | High     | -                    | Sign a test callback, then verify it      | Same event for every method and outcome          | `fake-payment/fake-gateway.test.ts`                | ✅  | ⬜      |
| TC-API-368-05 | Production refuses fake and sandbox | High     | `APP_ENV=production` | Start with `PAYMENT_GATEWAY=fake`         | Startup error naming `PAYMENT_GATEWAY`           | `packages/config/src/env.test.ts`                  | ✅  | ⬜      |
| TC-API-368-06 | No card data stored or logged       | High     | -                    | Parse and verify a card callback          | Event has no card fields; log line has ids only  | `parse-callback.test.ts`, `paymob-gateway.test.ts` | ✅  | ⬜      |
| TC-API-368-07 | Paymob down                         | Medium   | -                    | Stub fetch returns 401 or throws          | `PAYMENT_GATEWAY_UNAVAILABLE`, no secret in text | `paymob/paymob-gateway.test.ts`                    | ✅  | ⬜      |
| TC-API-368-08 | Live sandbox callback (after #366)  | High     | Paymob test keys     | Pay with a test card, replay the callback | Accepted with the real HMAC field order          | manual only                                        | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
