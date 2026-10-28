/** Use case: remove a fabric from the catalogue (FR-REC-03). The write and its audit row happen in one transaction. */
import { AppError } from "../domain/errors";
import type { FabricRepository } from "../ports/fabric-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Deletes a fabric.
 *
 * @param deps - Fabric repository.
 * @param admin - Verified admin.
 * @param id - Fabric id.
 * @throws {AppError} FABRIC_NOT_FOUND when no fabric has that id; FORBIDDEN when the caller is not an admin.
 */
export async function deleteFabric(
  deps: { readonly fabrics: FabricRepository },
  admin: AuthContext,
  id: string,
): Promise<void> {
  if (!(await deps.fabrics.remove(admin, id))) throw new AppError("FABRIC_NOT_FOUND");
}
