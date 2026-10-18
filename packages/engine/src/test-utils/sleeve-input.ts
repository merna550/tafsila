/** Test helper (issue #134): the sleeve input of a body, drafted from the seed blouse's bodice armholes. */
import type { EaseProfile, Measurements } from "@tafsila/schemas";
import { draftBodice } from "../blocks/bodice/draft-bodice";
import type { SleeveInput, SleeveLength } from "../blocks/sleeve/types";
import { bodiceCase } from "./bodice-input";

/**
 * Builds the sleeve input for one body, length and ease profile.
 *
 * @param m - Measurements.
 * @param length - Sleeve length option; default `long`.
 * @param profile - Ease profile; default `regular`.
 * @returns The input for `draftSleeve`.
 */
export function sleeveCase(
  m: Measurements,
  length: SleeveLength = "long",
  profile: EaseProfile = "regular",
): SleeveInput {
  const bodice = bodiceCase(m, profile);
  const { armhole } = draftBodice(bodice.input);
  return {
    bicepHalfMm: bodice.resolved.sleeveBicepHalfMm,
    wristHalfMm: bodice.resolved.sleeveWristHalfMm,
    armLengthMm: bodice.resolved.armLengthMm,
    armholeBackMm: armhole.backLengthMm,
    armholeFrontMm: armhole.frontLengthMm,
    length,
  };
}
