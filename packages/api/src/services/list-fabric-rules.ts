/** Use case: list the recommendation rules for the admin editor. */
import type { AdminFabricRule } from "@tafsila/schemas";
import type { FabricRuleRepository } from "../ports/fabric-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Lists every rule with its review flag and edit trail.
 *
 * @param deps - Rule repository.
 * @param ctx - Verified admin (the route checks the role).
 * @returns The items, ordered by id.
 */
export async function listFabricRules(
  deps: { readonly fabricRules: FabricRuleRepository },
  ctx: AuthContext,
): Promise<{ items: AdminFabricRule[] }> {
  return { items: await deps.fabricRules.list(ctx) };
}
