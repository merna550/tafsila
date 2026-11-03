/** Plan limit values and the client rule (ADR-365 item 6). The adapters supply the values; the rules live here. */
/** What a user's plan allows. */
export interface PlanLimitValues {
  /** Null means unlimited. */
  readonly maxClients: number | null;
  /** Chat messages allowed for one design. */
  readonly chatPerDesign: number;
}

/** Clients allowed without a plan. */
export const DEFAULT_MAX_CLIENTS = 10;

/**
 * The limits of a user without an active plan: 10 clients and the configured chat messages per design (default 10).
 *
 * @param chatPerDesign - Chat messages per design from the jobs configuration.
 * @returns The default limits.
 */
export function defaultPlanLimits(chatPerDesign: number): PlanLimitValues {
  return { maxClients: DEFAULT_MAX_CLIENTS, chatPerDesign };
}

/**
 * Whether one more client may be added. A user over the limit keeps her clients; only adding is refused.
 *
 * @param limits - The user's limits.
 * @param count - Clients she has now.
 * @returns True when one more is allowed.
 */
export function canAddClient(limits: PlanLimitValues, count: number): boolean {
  return limits.maxClients === null || count < limits.maxClients;
}
