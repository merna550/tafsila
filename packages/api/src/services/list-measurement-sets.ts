/** Use case: list the caller's measurement sets, each with fresh warnings. */
import type { ListMeasurementSetsQuery, MeasurementSet, Page } from "@tafsila/schemas";
import { warningsOf } from "../domain/measurements-check";
import type { MeasurementSetRepository } from "../ports/measurement-set-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Lists measurement sets, newest first.
 *
 * @param deps - Measurement set repository.
 * @param ctx - Verified caller.
 * @param query - Optional client filter and paging.
 * @returns One page of sets.
 */
export async function listMeasurementSets(
  deps: { readonly measurementSets: MeasurementSetRepository },
  ctx: AuthContext,
  query: ListMeasurementSetsQuery,
): Promise<Page<MeasurementSet>> {
  const page = await deps.measurementSets.list(ctx, query);
  return { ...page, items: page.items.map((set) => ({ ...set, warnings: warningsOf(set.measurements) })) };
}
