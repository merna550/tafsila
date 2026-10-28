/** Use case: list the fabric catalogue for the admin editor. */
import type { AdminFabric } from "@tafsila/schemas";
import type { FabricRepository } from "../ports/fabric-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Lists every fabric with its review flag and edit trail.
 *
 * @param deps - Fabric repository.
 * @param ctx - Verified admin (the route checks the role).
 * @returns The items, ordered by id.
 */
export async function listFabrics(
  deps: { readonly fabrics: FabricRepository },
  ctx: AuthContext,
): Promise<{ items: AdminFabric[] }> {
  return { items: await deps.fabrics.list(ctx) };
}
