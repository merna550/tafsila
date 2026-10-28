/** Use case: read the latest saved fabric calculation of a version. */
import type { FabricCalc } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import type { FabricCalcRepository } from "../ports/fabric-calc-repository";
import type { AuthContext } from "../ports/token-verifier";

/** Ports this use case needs. */
export interface GetFabricCalcDeps {
  readonly fabricCalcs: FabricCalcRepository;
}

/**
 * Reads the latest calculation.
 *
 * @param deps - Calculation repository.
 * @param ctx - Verified caller.
 * @param versionId - Version id.
 * @returns The calculation.
 * @throws {NotFoundError} When the version is not the caller's or has no saved calculation.
 */
export async function getFabricCalc(
  deps: GetFabricCalcDeps,
  ctx: AuthContext,
  versionId: string,
): Promise<FabricCalc> {
  const calc = await deps.fabricCalcs.latest(ctx, versionId);
  if (!calc) throw new NotFoundError("fabric calculation");
  return calc;
}
