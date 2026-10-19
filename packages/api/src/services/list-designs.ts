/** Use case: list the caller's designs with title search, client filter and paging. */
import type { DesignListItem, ListDesignsQuery, Page } from "@tafsila/schemas";
import type { DesignRepository } from "../ports/design-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Lists the caller's designs, most recently updated first.
 *
 * @param deps - Design repository.
 * @param ctx - Verified caller.
 * @param query - Search, filter and paging.
 * @returns One page of designs with their summaries.
 */
export function listDesigns(
  deps: { readonly designs: DesignRepository },
  ctx: AuthContext,
  query: ListDesignsQuery,
): Promise<Page<DesignListItem>> {
  return deps.designs.list(ctx, query);
}
