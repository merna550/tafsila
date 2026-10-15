/** The resolve step: spec + measurements + ease profile become the named inputs of the block drafters (issue #126). */
import type { DesignSpec, EngineOptions, Measurements } from "@tafsila/schemas";
import { BLOCK_BUILT_IN_EASE_MM as BUILT_IN } from "../constants/ease";
import { DraftingError } from "../errors/drafting-error";
import { styleEaseMm, totalEaseMm } from "./ease";
import { resolveSkirtLength } from "./skirt-length";
import type { ResolvedDraftInputs } from "./types";

/** Quarter of a circumference. */
const QUARTER = 4;

/**
 * Resolves ease and lengths. Pure: no mutation, no randomness. Does not validate measurement ranges (`validateMeasurements` does).
 *
 * @param spec - Validated design.
 * @param measurements - Body measurements in mm.
 * @param options - Engine options (only `easeProfile` is read).
 * @returns The inputs the block drafters read.
 * @throws {DraftingError} `FABRIC_NOT_SUPPORTED` for non-woven fabric, or a skirt length error.
 */
export function resolveDraftInputs(
  spec: DesignSpec,
  measurements: Measurements,
  options: Pick<EngineOptions, "easeProfile">,
): ResolvedDraftInputs {
  if ((spec.fabricType as string) !== "woven") {
    throw new DraftingError(
      "FABRIC_NOT_SUPPORTED",
      `Fabric type "${String(spec.fabricType)}" is not supported`,
    );
  }
  const profile = options.easeProfile;
  const fit = spec.bodice?.fit ?? "semi-fitted";
  const total = {
    bust: totalEaseMm(profile, fit, "bust"),
    waist: totalEaseMm(profile, fit, "waist"),
    hip: totalEaseMm(profile, fit, "hip"),
    upperArm: totalEaseMm(profile, fit, "upperArm"),
  };
  const acrossBack = totalEaseMm(profile, fit, "acrossBack");
  return {
    easeProfile: profile,
    bodiceFit: fit,
    bustQuarterMm: (measurements.bust + total.bust) / QUARTER,
    bodiceWaistQuarterMm: (measurements.waist + total.waist) / QUARTER,
    hipQuarterMm: (measurements.hip + total.hip) / QUARTER,
    skirtWaistQuarterMm: (measurements.waist + total.waist) / QUARTER,
    sleeveBicepHalfMm: (measurements.upperArm + total.upperArm) / 2,
    sleeveWristHalfMm: (measurements.wrist + BUILT_IN.sleeveWrist) / 2,
    acrossBackStyleEaseMm: styleEaseMm(acrossBack, "acrossBack"),
    styleEaseMm: {
      bust: styleEaseMm(total.bust, "bust"),
      bodiceWaist: styleEaseMm(total.waist, "bodiceWaist"),
      skirtHip: styleEaseMm(total.hip, "skirtHip"),
      skirtWaist: styleEaseMm(total.waist, "skirtWaist"),
      sleeveBicep: styleEaseMm(total.upperArm, "sleeveBicep"),
      acrossBack: styleEaseMm(acrossBack, "acrossBack"),
    },
    totalEaseMm: total,
    backLengthMm: measurements.backLength,
    frontLengthMm: measurements.frontLength,
    hipDepthMm: measurements.hipDepth,
    armLengthMm: measurements.armLength,
    shoulderWidthMm: measurements.shoulderWidth,
    skirtLengthMm: spec.skirt ? resolveSkirtLength(spec.skirt, measurements) : undefined,
  };
}
