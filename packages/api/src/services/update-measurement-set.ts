/** Use case: replace a measurement set's label, size label and measurements (re-validated). */
import type { MeasurementSet, UpdateMeasurementSetInput } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import { checkMeasurements } from "../domain/measurements-check";
import type { MeasurementSetRepository } from "../ports/measurement-set-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Updates a measurement set.
 *
 * @param deps - Measurement set repository.
 * @param ctx - Verified caller.
 * @param id - Set id.
 * @param input - New values.
 * @returns The updated set with its warnings.
 * @throws {MeasurementsInvalidError} When the engine finds a blocking problem (nothing is changed).
 * @throws {NotFoundError} When missing or not the caller's.
 */
export async function updateMeasurementSet(
  deps: { readonly measurementSets: MeasurementSetRepository },
  ctx: AuthContext,
  id: string,
  input: UpdateMeasurementSetInput,
): Promise<MeasurementSet> {
  const warnings = checkMeasurements(input.measurements);
  const stored = await deps.measurementSets.update(ctx, id, input);
  if (!stored) throw new NotFoundError("measurement set");
  return { ...stored, warnings };
}
