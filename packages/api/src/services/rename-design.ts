/** Use case: rename a design of the caller. */
import type { Design, UpdateDesignInput } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import type { DesignRepository } from "../ports/design-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Changes a design's title.
 *
 * @param deps - Design repository.
 * @param ctx - Verified caller.
 * @param id - Design id.
 * @param input - Validated new title.
 * @returns The updated design.
 * @throws {NotFoundError} When missing or not the caller's.
 */
export async function renameDesign(
  deps: { readonly designs: DesignRepository },
  ctx: AuthContext,
  id: string,
  input: UpdateDesignInput,
): Promise<Design> {
  const design = await deps.designs.rename(ctx, id, input.title);
  if (!design) throw new NotFoundError("design");
  return design;
}
