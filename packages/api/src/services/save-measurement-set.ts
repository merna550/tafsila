/** Use case: validate and save a measurement set. Errors block, warnings come back with the saved set. */
import type { MeasurementSet, SaveMeasurementSetInput } from "@tafsila/schemas";
import { checkMeasurements } from "../domain/measurements-check";
import type { MeasurementSetRepository } from "../ports/measurement-set-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Saves a measurement set for the caller.
 *
 * @param deps - Measurement set repository.
 * @param ctx - Verified caller.
 * @param input - Shape-valid set.
 * @returns The stored set with its warnings.
 * @throws {MeasurementsInvalidError} When the engine finds a blocking problem (nothing is stored).
 * @throws {NotFoundError} When `clientId` is not the caller's.
 */
export async function saveMeasurementSet(
  deps: { readonly measurementSets: MeasurementSetRepository },
  ctx: AuthContext,
  input: SaveMeasurementSetInput,
): Promise<MeasurementSet> {
  const warnings = checkMeasurements(input.measurements);
  const stored = await deps.measurementSets.create(ctx, input);
  return { ...stored, warnings };
}
