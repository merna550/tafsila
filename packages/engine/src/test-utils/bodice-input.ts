/** Test helper (issue #128): the bodice input of a body for a given ease profile and bodice fit. */
import type { DesignSpec, EaseProfile, Measurements } from "@tafsila/schemas";
import { dartedBlouse } from "@tafsila/test-fixtures";
import { bodiceInputFrom } from "../blocks/bodice/draft-bodice";
import type { BodiceInput } from "../blocks/bodice/types";
import type { BodiceFit } from "../constants/ease";
import { resolveDraftInputs } from "../resolve/resolve-draft-inputs";
import type { ResolvedDraftInputs } from "../resolve/types";

/** A bodice input together with the resolved inputs it came from. */
export interface BodiceCase {
  /** The input for `draftBodice`. */
  readonly input: BodiceInput;
  /** The resolve step output, for the ease totals. */
  readonly resolved: ResolvedDraftInputs;
  /** The design used. */
  readonly spec: DesignSpec;
}

/**
 * Builds the bodice input of the seed blouse for one body, profile and fit.
 *
 * @param m - Measurements.
 * @param profile - Ease profile; default `regular`.
 * @param fit - Bodice fit; default `semi-fitted`.
 * @returns The case.
 */
export function bodiceCase(
  m: Measurements,
  profile: EaseProfile = "regular",
  fit: BodiceFit = "semi-fitted",
): BodiceCase {
  const spec: DesignSpec = { ...dartedBlouse, bodice: { ...dartedBlouse.bodice!, fit } };
  const resolved = resolveDraftInputs(spec, m, { easeProfile: profile });
  return { input: bodiceInputFrom(m, spec, resolved), resolved, spec };
}
