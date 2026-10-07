---
packages: []
level: intermediate
adr: ADR-012
---

# Paymob and Fawry

**In one line:** Egyptian payment gateways, so customers can pay in EGP by card, mobile wallet or cash at a kiosk. Planned for M7; behind a `PaymentGateway` port.

## What it is (plain words)

Paymob is an Egypt-based payment provider with one API for several payment methods. It sends our server a signed notification (webhook) when a payment succeeds. Fawry is the Egyptian network of cash-payment points: a customer gets a reference code and pays cash in a shop or app. Neither has an official npm SDK we depend on; we call their HTTP APIs from an adapter.

## Why we chose it

- **Local payment methods.** Egyptian customers pay by local card, mobile wallets (Vodafone Cash and others) and cash references. Checked on 2026-10-07: Paymob lists cards, mobile wallets, instalment (BNPL) providers and kiosk payment through Aman and Masary ([Paymob developer docs](https://developers.paymob.com/paymob-docs)).
- **EGP pricing** and EGP settlement to an Egyptian bank account.
- **Sandbox mode** (`PAYMOB_MODE=sandbox`) for development, preview and staging; production uses `live` ([WORKFLOW section 7](../../WORKFLOW.md)).
- **Port and adapter.** Services call a `PaymentGateway` interface, so adding another gateway does not touch business rules.

## Alternatives we considered (and why not)

- **Stripe:** checked on 2026-10-07: Stripe does not offer payment processing to Egypt-based businesses (it lists Egypt only for tax services; merchants use a US entity as a workaround). See [Stripe country availability](https://support.stripe.com/questions/stripe-feature-availability-by-country). This is a correction of the wording "verify current status" in the issue: it is unsupported, so not an option.
- **PayPal:** poor adoption among Egyptian consumers.

## When we would change it

If Paymob fees or reliability become a problem, add a second gateway behind the same port. **Fawry:** the original plan said "Fawry cash through Paymob", but Paymob's documented kiosk partners are Aman and Masary; confirm Fawry availability (through Paymob or Fawry's own gateway) during the M7 onboarding before promising it in the product.

## Where it lives in our code

- `packages/config/src/env.ts` (`PAYMOB_MODE`), `.env.example`.
- Requirements: [SRS section 4.14](../../SRS.md). The adapter will live under packages/api/src/adapters/paymob/ (planned).

## The 20% you need

- The browser never decides a payment succeeded; only the verified webhook (HMAC signature, [glossary](../glossary.md#hmac)) grants credits.
- Webhooks can arrive twice: handle them idempotently, writing to the credits [ledger](../glossary.md#ledger).
- Amounts are integers in piastres.

## Commands you'll use

None yet; sandbox keys come from the Paymob dashboard and go in environment variables, never in code.

## Common mistakes

- Granting credits from the redirect page instead of the webhook.
- Forgetting to switch `PAYMOB_MODE` per environment.

## Learn more

- [Paymob developer docs](https://developers.paymob.com/paymob-docs) (official), [Fawry](https://fawry.com/) (official site)
- Glossary: [Paymob](../glossary.md#paymob), [Fawry](../glossary.md#fawry), [EGP](../glossary.md#egp)
