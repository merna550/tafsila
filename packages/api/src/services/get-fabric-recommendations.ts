/** Use case: recommend 3 to 5 fabrics and an avoid list for a saved version, from the database catalogue and rules (FR-REC-02, ADR-312 item 8). */
import { recommend } from "@tafsila/fabric-kb";
import type { RecommendFabricsResponse } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import type { FabricRepository, FabricRuleRepository } from "../ports/fabric-repository";
import type { PatternVersionRepository } from "../ports/pattern-version-repository";
import type { AuthContext } from "../ports/token-verifier";

/** Ports this use case needs. */
export interface GetFabricRecommendationsDeps {
  readonly versions: PatternVersionRepository;
  readonly fabrics: FabricRepository;
  readonly fabricRules: FabricRuleRepository;
}

/**
 * Runs the pure `recommend` on the version's design with the stored catalogue and rules.
 *
 * @param deps - Version, catalogue and rule repositories.
 * @param ctx - Verified caller.
 * @param versionId - Version id.
 * @returns The recommended fabrics, the avoid list and whether any row used is still a draft.
 * @throws {NotFoundError} When the version is missing or not the caller's.
 */
export async function getFabricRecommendations(
  deps: GetFabricRecommendationsDeps,
  ctx: AuthContext,
  versionId: string,
): Promise<RecommendFabricsResponse> {
  const version = await deps.versions.get(ctx, versionId);
  if (!version) throw new NotFoundError("version");
  const [fabrics, rules] = await Promise.all([deps.fabrics.list(ctx), deps.fabricRules.list(ctx)]);
  const { recommended, avoid } = recommend(version.spec, fabrics, rules);
  return { recommended, avoid, isDraft: [...fabrics, ...rules].some((row) => row.isDraft) };
}
