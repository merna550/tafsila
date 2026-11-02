/** AiUsageRepository through the `api_app` door: calls the `private` functions, since api_app holds no table privileges. */
import { sql } from "drizzle-orm";
import { utcDayStart } from "../../domain/utc-day";
import type { AiUsageRepository } from "../../ports/ai-usage-repository";
import type { WithApiRole } from "./with-user";

/**
 * Creates the AI usage adapter.
 *
 * @param withApiRole - Door to the private functions.
 * @returns An AiUsageRepository.
 */
export function createAiUsageRepository(withApiRole: WithApiRole): AiUsageRepository {
  return {
    record: (entry) =>
      withApiRole(async (tx) => {
        await tx.execute(
          sql`select private.record_ai_usage(${entry.userId}::uuid, ${entry.designId ?? null}::uuid, ${entry.kind}, ${entry.provider}, ${entry.model}, ${entry.inputTokens}, ${entry.outputTokens}, ${entry.costUsd}, ${entry.latencyMs})`,
        );
      }),
    countToday: (userId, kind, now) =>
      withApiRole(async (tx) => {
        const rows = await tx.execute<{ count: number }>(
          sql`select private.ai_usage_count_since(${userId}::uuid, ${kind}, ${utcDayStart(now).toISOString()}::timestamptz) as count`,
        );
        return Number(rows[0]?.count ?? 0);
      }),
  };
}
