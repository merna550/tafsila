/**
 * Waistband rules (issue #140, decision 140): the band's sewn edge against the skirt waist (FR-VAL-01, ± 2 mm, the
 * closure underlap declared apart), the waist passing over the hip when nothing opens or the waist is elastic
 * (FR-VAL-08), and a contour band drawn straight on a gathered top (FR-VAL-08).
 */
import type { ValidationCheck } from "@tafsila/schemas";
import { SEAM_MATCH_TOLERANCE_MM } from "../../constants/validation";
import { HIP_PASS_EASE_MM } from "../../constants/waistband";
import { bodyLineMultiplier } from "../../pieces/body-lines";
import { edgeLengthMm } from "../../pieces/measure";
import { closedWaistMm, WAIST_EDGE_ID, waistPieces } from "../../pieces/waist-seam";
import type { DraftContext } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../../validation/messages";

/** Keys of the numbers the module passes to its rules. */
export const WAISTBAND_KEYS = {
  overlapMm: "waistband.overlapMm",
  contourFlat: "waistband.contourFlat",
  elasticMm: "waistband.elasticMm",
} as const;

/** Rounds a length for a message. */
const shown = Math.round;

/**
 * Whole-garment length of the finish's edges that sew to the skirt waist: each piece's paired edges, times the
 * copies cut. Measured from the finish pieces themselves.
 *
 * @param ctx - Finished context.
 * @returns Length in mm.
 */
export function finishSeamMm(ctx: DraftContext): number {
  const skirtIds = new Set(waistPieces(ctx.pieces).map((p) => p.id));
  return ctx.pieces.reduce((sum, piece) => {
    const paired = piece.edges.filter(
      (e) =>
        e.pairsWith?.edgeId === WAIST_EDGE_ID && skirtIds.has(e.pairsWith.pieceId) && !skirtIds.has(piece.id),
    );
    const lengthMm = paired.reduce((s, e) => s + edgeLengthMm(piece, e.id), 0);
    return sum + lengthMm * bodyLineMultiplier(piece);
  }, 0);
}

/**
 * Whole-garment skirt waist the finish must sew to: darts and pleats closed, gathers drawn up, or let out for an
 * elastic casing.
 *
 * @param ctx - Finished context.
 * @returns Length in mm.
 */
export function skirtWaistMm(ctx: DraftContext): number {
  const gathers = ctx.spec.waistband === "elastic" ? "relaxed" : "sewn";
  return waistPieces(ctx.pieces).reduce(
    (sum, p) => sum + closedWaistMm(p, gathers) * bodyLineMultiplier(p),
    0,
  );
}

/**
 * Reads a number the module passed on.
 *
 * @param ctx - Finished context.
 * @param key - Resolved key.
 * @returns The value, 0 when missing.
 */
function read(ctx: DraftContext, key: string): number {
  return ctx.resolved[key] ?? 0;
}

/**
 * Whether the waistband module ran.
 *
 * @param ctx - Finished context.
 * @returns True when its numbers are present.
 */
function drafted(ctx: DraftContext): boolean {
  return ctx.resolved[WAISTBAND_KEYS.contourFlat] !== undefined;
}

/**
 * The band length check.
 *
 * @param ctx - Finished context.
 * @returns One FR-VAL-01 check.
 */
function lengthCheck(ctx: DraftContext): ValidationCheck {
  const measuredMm = finishSeamMm(ctx);
  const expectedMm = skirtWaistMm(ctx);
  const passes = Math.abs(measuredMm - expectedMm) <= SEAM_MATCH_TOLERANCE_MM;
  const code = passes ? "WAISTBAND_LENGTH_OK" : "WAISTBAND_LENGTH_MISMATCH";
  return {
    id: "FR-VAL-01",
    code,
    status: passes ? "pass" : "fail",
    message: formatMessage(code, {
      mm: shown(measuredMm),
      expected: shown(expectedMm),
      overlap: shown(read(ctx, WAISTBAND_KEYS.overlapMm)),
    }),
    measuredMm,
    expectedMm,
  };
}

/** The finish sews to the whole skirt waist within 2 mm; the closure underlap is declared, not a mismatch. */
export const waistbandLengthRule: ValidationRule = {
  id: "FR-VAL-01",
  code: "WAISTBAND_LENGTH_MISMATCH",
  appliesTo: drafted,
  run: lengthCheck,
};

/**
 * Whether the waist must pass over the hip: an elastic waist, or nothing opens.
 *
 * @param ctx - Finished context.
 * @returns True when the hip check applies.
 */
export function mustPassHip(ctx: DraftContext): boolean {
  return ctx.spec.waistband === "elastic" || ctx.spec.closure.type === "none";
}

/**
 * The hip check: the opening (the relaxed casing, or the band) against the hip plus `HIP_PASS_EASE_MM`.
 *
 * @param ctx - Finished context.
 * @returns One FR-VAL-08 check.
 */
function hipCheck(ctx: DraftContext): ValidationCheck {
  const measuredMm = finishSeamMm(ctx);
  const expectedMm = ctx.measurements.hip + HIP_PASS_EASE_MM;
  const fits = measuredMm >= expectedMm;
  const code = fits ? "WAIST_HIP_PASS_OK" : "WAIST_HIP_PASS_TIGHT";
  return {
    id: "FR-VAL-08",
    code,
    status: fits ? "pass" : "warn",
    message: formatMessage(code, { mm: shown(measuredMm), expected: shown(expectedMm) }),
    measuredMm,
    expectedMm,
  };
}

/** An elastic waist, or one with no opening, must pull on over the hip (FR-VAL-08). */
export const hipPassRule: ValidationRule = {
  id: "FR-VAL-08",
  code: "WAIST_HIP_PASS_TIGHT",
  appliesTo: (ctx) => drafted(ctx) && mustPassHip(ctx),
  run: hipCheck,
};

/** A contour band asked on a gathered, pleated or tiered skirt is drafted straight (decision 140, 4). */
export const contourFlatRule: ValidationRule = {
  id: "FR-VAL-08",
  code: "WAISTBAND_CONTOUR_FLAT",
  appliesTo: (ctx) => read(ctx, WAISTBAND_KEYS.contourFlat) === 1,
  run: () => ({
    id: "FR-VAL-08",
    code: "WAISTBAND_CONTOUR_FLAT",
    status: "warn",
    message: formatMessage("WAISTBAND_CONTOUR_FLAT"),
  }),
};

/** Every waistband rule. */
export const WAISTBAND_RULES: readonly ValidationRule[] = [waistbandLengthRule, hipPassRule, contourFlatRule];
