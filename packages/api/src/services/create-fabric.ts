/** Use case: add a fabric to the catalogue (FR-REC-03). The write and its audit row happen in one transaction. */
import type { AdminFabric, CreateFabricInput } from "@tafsila/schemas";
import type { FabricRepository } from "../ports/fabric-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Adds a fabric.
 *
 * @param deps - Fabric repository.
 * @param admin - Verified admin.
 * @param input - The new fabric.
 * @returns The stored fabric.
 * @throws {AppError} FABRIC_ID_TAKEN when the id exists; FORBIDDEN when the database says the caller is not an admin.
 */
export function createFabric(
  deps: { readonly fabrics: FabricRepository },
  admin: AuthContext,
  input: CreateFabricInput,
): Promise<AdminFabric> {
  return deps.fabrics.create(admin, input);
}
