/** Use case: delete one measurement set. */
import { NotFoundError } from "../domain/errors";
import type { MeasurementSetRepository } from "../ports/measurement-set-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Deletes a measurement set.
 *
 * @param deps - Measurement set repository.
 * @param ctx - Verified caller.
 * @param id - Set id.
 * @throws {NotFoundError} When missing or not the caller's.
 */
export async function deleteMeasurementSet(
  deps: { readonly measurementSets: MeasurementSetRepository },
  ctx: AuthContext,
  id: string,
): Promise<void> {
  if (!(await deps.measurementSets.remove(ctx, id))) throw new NotFoundError("measurement set");
}
