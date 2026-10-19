/** Use case: read one design of the caller with its current version's inputs. */
import type { DesignDetail } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import type { DesignRepository } from "../ports/design-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Reads a design.
 *
 * @param deps - Design repository.
 * @param ctx - Verified caller.
 * @param id - Design id.
 * @returns The design and its current version.
 * @throws {NotFoundError} When missing or not the caller's.
 */
export async function getDesign(
  deps: { readonly designs: DesignRepository },
  ctx: AuthContext,
  id: string,
): Promise<DesignDetail> {
  const detail = await deps.designs.get(ctx, id);
  if (!detail) throw new NotFoundError("design");
  return detail;
}
