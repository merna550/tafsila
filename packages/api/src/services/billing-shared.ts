/** Helpers shared by the billing use cases: the lazy trial grant. */
import { TRIAL_CREDITS } from "../domain/billing";
import type { Analytics } from "../ports/analytics";
import type { BillingRepository } from "../ports/billing-repository";

/** Ports the billing use cases need. */
export interface BillingDeps {
  readonly billing: BillingRepository;
  readonly analytics: Analytics;
}

/**
 * Grants the free trial to a user verified before M7 (or verified between the migration and the deploy) who never got it.
 * Safe to call on every request: the database grants once and a later call changes nothing.
 *
 * @param deps - Billing repository and analytics.
 * @param userId - The caller.
 */
export async function ensureTrial(deps: BillingDeps, userId: string): Promise<void> {
  if (await deps.billing.grantTrial(userId, TRIAL_CREDITS)) {
    deps.analytics.capture(userId, "trial_granted", { source: "lazy" });
  }
}
