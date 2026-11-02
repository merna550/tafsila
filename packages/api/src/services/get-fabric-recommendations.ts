/** Use case: recommend 3 to 5 fabrics and an avoid list for a saved version, from the database catalogue and rules (FR-REC-02, ADR-312 item 8). */
import { recommend } from "@tafsila/fabric-kb";
import type { FabricSummary, PatternVersion, RecommendFabricsResponse } from "@tafsila/schemas";
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

/** A recommendation with what the explanation needs besides it: the version and the whole catalogue. */
export interface LoadedRecommendation {
  /** What the route returns. */
  readonly response: RecommendFabricsResponse;
  /** The version the fabrics were chosen for. */
  readonly version: PatternVersion;
  /** Every catalogue fabric (the explanation check needs the names it must not see). */
  readonly catalogue: FabricSummary[];
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
  return (await loadRecommendation(deps, ctx, versionId)).response;
}

/**
 * Like `getFabricRecommendations`, and also returns the version and the catalogue (used by the explanation).
 *
 * @param deps - Version, catalogue and rule repositories.
 * @param ctx - Verified caller.
 * @param versionId - Version id.
 * @returns The recommendation, the version and the catalogue summaries.
 * @throws {NotFoundError} When the version is missing or not the caller's.
 */
export async function loadRecommendation(
  deps: GetFabricRecommendationsDeps,
  ctx: AuthContext,
  versionId: string,
): Promise<LoadedRecommendation> {
  const version = await deps.versions.get(ctx, versionId);
  if (!version) throw new NotFoundError("version");
  const [fabrics, rules] = await Promise.all([deps.fabrics.list(ctx), deps.fabricRules.list(ctx)]);
  const { recommended, avoid } = recommend(version.spec, fabrics, rules);
  const summaries: Record<string, FabricSummary> = Object.fromEntries(
    fabrics.map((f) => [f.id, summarize(f)]),
  );
  const response: RecommendFabricsResponse = {
    recommended: recommended.map((item) => withFabric(item, summaries)),
    avoid: avoid.map((item) => withFabric(item, summaries)),
    isDraft: [...fabrics, ...rules].some((row) => row.isDraft),
  };
  return { response, version, catalogue: Object.values(summaries) };
}

/**
 * Cuts a catalogue row down to what the screen shows.
 *
 * @param fabric - A catalogue row.
 * @returns Its id, names and properties.
 */
function summarize(fabric: FabricSummary): FabricSummary {
  const { id, nameAr, nameEn, properties } = fabric;
  return { id, nameAr, nameEn, properties };
}

/**
 * Adds the catalogue summary of the item's fabric. `recommend` only returns ids of the fabrics it was given, so the lookup always hits.
 *
 * @param item - A recommended or avoided fabric.
 * @param summaries - Catalogue summaries by fabric id.
 * @returns The item with its `fabric` summary.
 */
function withFabric<T extends { fabricId: string }>(
  item: T,
  summaries: Record<string, FabricSummary>,
): T & { fabric: FabricSummary } {
  return { ...item, fabric: summaries[item.fabricId] as FabricSummary };
}
