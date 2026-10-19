/** Use case: delete a design of the caller together with its versions. */
import { NotFoundError } from "../domain/errors";
import type { DesignRepository } from "../ports/design-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Deletes a design.
 *
 * @param deps - Design repository.
 * @param ctx - Verified caller.
 * @param id - Design id.
 * @throws {NotFoundError} When missing or not the caller's.
 */
export async function deleteDesign(
  deps: { readonly designs: DesignRepository },
  ctx: AuthContext,
  id: string,
): Promise<void> {
  if (!(await deps.designs.remove(ctx, id))) throw new NotFoundError("design");
}
