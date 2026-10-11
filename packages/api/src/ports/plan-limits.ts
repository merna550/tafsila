/** Plan limits port: what the user's plan allows. M7 (payments) replaces the unlimited adapter. */
import type { AuthContext } from "./token-verifier";

/** Answers plan questions for a user. */
export interface PlanLimits {
  /**
   * Whether the user may add one more client.
   *
   * @param ctx - Verified caller.
   * @param currentCount - Clients the caller has now.
   * @returns True when one more is allowed.
   */
  canAddClient(ctx: AuthContext, currentCount: number): Promise<boolean>;
}
