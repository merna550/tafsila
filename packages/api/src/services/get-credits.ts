/** Use case: the caller's credit balance, grants, plan and limits (FR-BILL-02). */
import type { CreditsResponse } from "@tafsila/schemas";
import { isRenewSoon, toGrants } from "../domain/billing";
import type { Clock } from "../ports/clock";
import type { PlanLimits } from "../ports/plan-limits";
import type { AuthContext } from "../ports/token-verifier";
import { ensureTrial, type BillingDeps } from "./billing-shared";

/** Ports this use case needs. */
export interface GetCreditsDeps extends BillingDeps {
  readonly planLimits: PlanLimits;
  readonly clock: Clock;
}

/**
 * Reads the caller's credits after the lazy trial grant.
 *
 * @param deps - Billing, plan limits, clock and analytics.
 * @param ctx - Verified caller.
 * @returns Balance, grants (earliest expiry first), plan (or null) and limits.
 */
export async function getCredits(deps: GetCreditsDeps, ctx: AuthContext): Promise<CreditsResponse> {
  await ensureTrial(deps, ctx.userId);
  const [summary, limits] = await Promise.all([
    deps.billing.summary(ctx.userId),
    deps.planLimits.limits(ctx),
  ]);
  const now = deps.clock.now();
  return {
    balance: summary.balance,
    grants: toGrants(summary.lots),
    plan: summary.plan && {
      code: summary.plan.code,
      periodEnd: summary.plan.periodEnd,
      renewSoon: isRenewSoon(new Date(summary.plan.periodEnd), now),
    },
    limits,
  };
}
