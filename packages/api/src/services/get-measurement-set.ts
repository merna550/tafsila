/** Use case: read one measurement set with fresh warnings. */
import type { MeasurementSet } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import { warningsOf } from "../domain/measurements-check";
import type { MeasurementSetRepository } from "../ports/measurement-set-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Reads a measurement set.
 *
 * @param deps - Measurement set repository.
 * @param ctx - Verified caller.
 * @param id - Set id.
 * @returns The set with warnings computed now.
 * @throws {NotFoundError} When missing or not the caller's.
 */
export async function getMeasurementSet(
  deps: { readonly measurementSets: MeasurementSetRepository },
  ctx: AuthContext,
  id: string,
): Promise<MeasurementSet> {
  const stored = await deps.measurementSets.get(ctx, id);
  if (!stored) throw new NotFoundError("measurement set");
  return { ...stored, warnings: warningsOf(stored.measurements) };
}
