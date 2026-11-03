/** Plan limits port: what the user's plan allows. The rules that use the values live in domain/plan-limits.ts. */
import type { PlanLimitValues } from "../domain/plan-limits";
import type { AuthContext } from "./token-verifier";

/** Answers plan questions for a user. */
export interface PlanLimits {
  /**
   * The limits of the user's active plan, or the default limits when she has none.
   *
   * @param ctx - Verified caller.
   * @returns Max clients (null = unlimited) and chat messages per design.
   */
  limits(ctx: AuthContext): Promise<PlanLimitValues>;
}
