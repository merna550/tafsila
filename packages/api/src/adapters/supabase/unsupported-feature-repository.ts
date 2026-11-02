/** UnsupportedFeatureRepository through the `api_app` door: calls `private.record_unsupported_features`, which de-duplicates and checks ownership. */
import { sql } from "drizzle-orm";
import type { UnsupportedFeatureRepository } from "../../ports/unsupported-feature-repository";
import type { WithApiRole } from "./with-user";

/**
 * Creates the unsupported feature adapter.
 *
 * @param withApiRole - Door to the private functions.
 * @returns An UnsupportedFeatureRepository.
 */
export function createUnsupportedFeatureRepository(withApiRole: WithApiRole): UnsupportedFeatureRepository {
  return {
    recordMany: (userId, designId, texts) =>
      texts.length === 0
        ? Promise.resolve(0)
        : withApiRole(async (tx) => {
            const rows = await tx.execute<{ count: number }>(
              sql`select private.record_unsupported_features(${userId}::uuid, ${designId}::uuid, ${[...texts]}::text[]) as count`,
            );
            return Number(rows[0]?.count ?? 0);
          }),
  };
}
