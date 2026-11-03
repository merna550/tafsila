# Credits and the free trial

How a user gets her first 3 credits and how the API shows them (issue #370, [ADR-370](../../decisions/370-credits-trial.md)).

## The two ways the trial is granted

1. **At verification.** `POST /api/phone/verify` runs `private.confirm_phone` and `private.grant_trial` in one transaction (`PhoneVerificationRepository.confirm`). If the grant fails the verification is rolled back. The response has `trialGranted: true`.
2. **Lazily.** `GET /api/me/credits` calls `ensureTrial` first (`services/billing-shared.ts`). A user verified before M7 gets her 3 credits there; a second call grants nothing. #375 calls it before analyse and before saving version 1.

Both are safe to repeat: `grant_trial` locks the user's `trial_phones` row and sets `trial_granted_at`. One phone number can only ever hold one row, so a second account (or a recreated account) with the same number fails with `PHONE_ALREADY_USED` and gets no trial.

## What `GET /api/me/credits` returns

`{ balance, grants, plan, limits }`. `grants` are the unexpired lots with credits left, earliest expiry first (`expiresAt: null` = never). `plan` is the active subscription (period not over) or `null`; `renewSoon` is true within 7 days of the period end. `limits` is `{ maxClients, chatPerDesign }` (`maxClients: null` = unlimited); without a plan it is 10 clients and `CHAT_MESSAGES_PER_DESIGN` (default 10).

All the expiry math is in `private.credit_lots`; `credit_balance` and `credit_summary` read it.

## Give a local user credits

```sql
-- in `pnpm db:reset` data, as the postgres user (psql or Studio)
select private.grant_credits('<user id>', 5, 'admin', null, null);
```

In tests use `createMemoryApp()`: `billing.grantLot(userId, 5, null)` adds credits, `billing.setPlan(userId, {...})` sets a plan, and `startingCredits` gives every user some.
