/** Drizzle plan limits: reads the active plan through `private.plan_limits`; no active plan gives the default limits (ADR-365 item 6). */
import { sql } from "drizzle-orm";
import { defaultPlanLimits } from "../../domain/plan-limits";
import type { PlanLimits } from "../../ports/plan-limits";
import type { WithApiRole } from "./with-user";

/**
 * Creates the plan limits adapter.
 *
 * @param withApiRole - Door to the private functions.
 * @param chatPerDesign - Chat messages per design without a plan (from the jobs configuration).
 * @returns A PlanLimits.
 */
export function createPlanLimits(withApiRole: WithApiRole, chatPerDesign: number): PlanLimits {
  return {
    limits: (ctx) =>
      withApiRole(async (tx) => {
        const rows = (await tx.execute(
          sql`select max_clients, chat_per_design from private.plan_limits(${ctx.userId}::uuid)`,
        )) as unknown as { max_clients: number | null; chat_per_design: number }[];
        const row = rows[0];
        return row
          ? { maxClients: row.max_clients, chatPerDesign: row.chat_per_design }
          : defaultPlanLimits(chatPerDesign);
      }),
  };
}
