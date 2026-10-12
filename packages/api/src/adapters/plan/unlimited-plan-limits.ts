/** Plan limits adapter used until M7: everything is allowed. */
import type { PlanLimits } from "../../ports/plan-limits";

/**
 * Creates plan limits that never deny anything.
 *
 * @returns The unlimited plan limits.
 */
export function createUnlimitedPlanLimits(): PlanLimits {
  return { canAddClient: () => Promise.resolve(true) };
}
