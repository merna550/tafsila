/** Use case: delete a design of the caller together with its versions and photos. */
import { NotFoundError } from "../domain/errors";
import type { DesignRepository } from "../ports/design-repository";
import type { PhotoStorage } from "../ports/photo-storage";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Deletes a design. The photos go first, so a storage failure leaves the design in place and the request can be repeated.
 *
 * @param deps - Design repository and photo storage.
 * @param ctx - Verified caller.
 * @param id - Design id.
 * @throws {NotFoundError} When missing or not the caller's.
 */
export async function deleteDesign(
  deps: { readonly designs: DesignRepository; readonly photoStorage: PhotoStorage },
  ctx: AuthContext,
  id: string,
): Promise<void> {
  if (!(await deps.designs.getPhotoPaths(ctx, id))) throw new NotFoundError("design");
  await deps.photoStorage.removeDesign(ctx.userId, id);
  if (!(await deps.designs.remove(ctx, id))) throw new NotFoundError("design");
}
