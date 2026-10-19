/** Use case: list a design's versions, newest first. */
import type { ListPatternVersionsQuery, Page, PatternVersionListItem } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import type { PatternVersionRepository } from "../ports/pattern-version-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Lists the versions of a design.
 *
 * @param deps - Version repository.
 * @param ctx - Verified caller.
 * @param designId - Design id.
 * @param query - Paging.
 * @returns One page of versions.
 * @throws {NotFoundError} When the design is missing or not the caller's.
 */
export async function listPatternVersions(
  deps: { readonly versions: PatternVersionRepository },
  ctx: AuthContext,
  designId: string,
  query: ListPatternVersionsQuery,
): Promise<Page<PatternVersionListItem>> {
  const page = await deps.versions.list(ctx, designId, query);
  if (!page) throw new NotFoundError("design");
  return page;
}
