/** Use case: store the fabric calculation the browser computed for a version, replacing the one with the same options (ADR-312 item 5). */
import type { FabricCalc, SaveFabricCalcInput } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import { checkFabricCalcResult, hashFabricOptions } from "../domain/fabric-checks";
import type { FabricCalcRepository } from "../ports/fabric-calc-repository";
import type { AuthContext } from "../ports/token-verifier";

/** Ports this use case needs. */
export interface SaveFabricCalcDeps {
  readonly fabricCalcs: FabricCalcRepository;
}

/**
 * Validates the result's shape and lengths, then stores the calculation.
 *
 * @param deps - Calculation repository.
 * @param ctx - Verified caller.
 * @param versionId - Version id.
 * @param input - Options, result and nesting version.
 * @returns The stored calculation.
 * @throws {FabricCalcInvalidError} When the result is wrong (422).
 * @throws {NotFoundError} When the version is missing or not the caller's.
 */
export async function saveFabricCalc(
  deps: SaveFabricCalcDeps,
  ctx: AuthContext,
  versionId: string,
  input: SaveFabricCalcInput,
): Promise<FabricCalc> {
  const result = checkFabricCalcResult(input.result);
  const saved = await deps.fabricCalcs.save(ctx, {
    versionId,
    options: input.options,
    optionsHash: hashFabricOptions(input.options),
    result,
    nestingVersion: input.nestingVersion,
  });
  if (!saved) throw new NotFoundError("version");
  return saved;
}
