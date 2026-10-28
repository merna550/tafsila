/** Use case: change a fabric of the catalogue (FR-REC-03). The write and its audit row happen in one transaction. */
import type { AdminFabric, UpdateFabricInput } from "@tafsila/schemas";
import { AppError } from "../domain/errors";
import type { FabricRepository } from "../ports/fabric-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Changes the given fields of a fabric.
 *
 * @param deps - Fabric repository.
 * @param admin - Verified admin.
 * @param id - Fabric id.
 * @param patch - Fields to change.
 * @returns The stored fabric.
 * @throws {AppError} FABRIC_NOT_FOUND when no fabric has that id; FORBIDDEN when the caller is not an admin.
 */
export async function updateFabric(
  deps: { readonly fabrics: FabricRepository },
  admin: AuthContext,
  id: string,
  patch: UpdateFabricInput,
): Promise<AdminFabric> {
  const fabric = await deps.fabrics.update(admin, id, patch);
  if (!fabric) throw new AppError("FABRIC_NOT_FOUND");
  return fabric;
}
