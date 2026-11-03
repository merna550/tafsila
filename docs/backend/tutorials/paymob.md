# Paymob: test mode, integrations, callbacks, secrets

Decision: [ADR-368](../../decisions/368-payment-gateway.md). Port: `packages/api/src/ports/payment-gateway.ts`.

## Locally and in CI: no account needed

`PAYMENT_GATEWAY=fake` (the default). `createIntention` returns a local checkout URL (`/ar/dev/fake-checkout?...`, the page is #380) or a kiosk reference. `signTestCallback(event)` builds a callback and signs it with `FAKE_PAYMENT_SECRET` using the same HMAC code as Paymob. Production refuses `fake`.

## Switch to Paymob test mode (after #366)

1. Paymob dashboard in **test mode**: Settings > Account info gives the secret key, public key and HMAC secret.
2. Create three integrations (Developers > Payment Integrations): online card, mobile wallet, cash kiosk. Copy each integration id.
3. Callback URLs: set the transaction processed callback and the response callback of each integration to `<APP_URL>/api/payments/callback` and `<APP_URL>/payments/return` (the route comes with #371).
4. Set the variables below, `PAYMENT_GATEWAY=paymob`, `PAYMOB_MODE=sandbox`.

| Variable                                          | Where it goes                                             |
| ------------------------------------------------- | --------------------------------------------------------- |
| `PAYMOB_SECRET_KEY`, `PAYMOB_HMAC_SECRET`         | GitHub `_STAGING` repo secrets + Vercel env (server only) |
| `PAYMOB_PUBLIC_KEY`                               | Vercel env (it ends up in the checkout URL, not a secret) |
| `PAYMOB_INTEGRATION_ID_CARD`, `_WALLET`, `_KIOSK` | Vercel env                                                |
| `APP_URL`                                         | Vercel env: the public URL of that environment            |

Production (M8) uses live keys, `PAYMOB_MODE=live`; the app refuses to start with `sandbox` or `fake` there.

## Test payments

Use the test cards and wallet numbers listed in Paymob's developer docs under "Test credentials" (they change; copy them from there, never from a real card). Never type a real card in test mode.

## Replay a callback

Callbacks are `POST` with the transaction in `obj` and the signature in the `hmac` query parameter. To replay one on a dev machine, build it with the fake gateway (`signTestCallback`) or resend a recorded sandbox callback unchanged; any edited field makes the signature fail (`HMAC_MISMATCH`).

## Rules

No card number, CVV or PAN is stored or logged. The parsed `PaymentEvent` has ids, amount (piastres), currency (EGP only), outcome and method; the log line has ids and outcome.
