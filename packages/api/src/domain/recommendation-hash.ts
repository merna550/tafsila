/** Hash of a fabric recommendation, the cache key of its AI explanation (issue #346, decision 346, 1). */
import { createHash } from "node:crypto";
import type { RecommendFabricsResponse } from "@tafsila/schemas";

/**
 * The part of a recommended or avoided fabric the explanation depends on.
 *
 * @param item - A recommended or avoided fabric.
 * @returns Its id and both reasons.
 */
function keyOf(item: { fabricId: string; reason: { ar: string; en: string } }): [string, string, string] {
  return [item.fabricId, item.reason.ar, item.reason.en];
}

/**
 * Hashes the recommended and avoided fabric ids and reasons in their order, so an admin edit of a rule or a fabric that
 * changes the result also changes the hash and the cached text is no longer used.
 *
 * @param response - The recommendation.
 * @returns A hex SHA-256.
 */
export function hashRecommendation(
  response: Pick<RecommendFabricsResponse, "recommended" | "avoid">,
): string {
  const canonical = JSON.stringify([response.recommended.map(keyOf), response.avoid.map(keyOf)]);
  return createHash("sha256").update(canonical).digest("hex");
}
