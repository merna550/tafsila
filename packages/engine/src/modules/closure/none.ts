/**
 * No closure (issue #143, FR-VAL-08, decision 143, 6): nothing opens, so the narrowest waist seam of a dress or skirt
 * must pass over the hips plus `HIP_PASS_EASE_MM`. The neck against the head is the neckline's rule (#139); a skirt
 * with a waistband or facing is the waistband's rule (#140), so this one covers the rest. It warns and never changes
 * the geometry.
 */
import type { ValidationCheck } from "@tafsila/schemas";
import { HIP_PASS_EASE_MM } from "../../constants/waistband";
import { bodyLineLengthMm, bodyLineMultiplier } from "../../pieces/body-lines";
import type { DraftContext } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../../validation/messages";

/** Tenths of a millimetre in a message. */
const MESSAGE_SCALE = 10;

/**
 * Rounds a length to 0.1 mm for a message.
 *
 * @param mm - Length.
 * @returns The rounded length.
 */
function shown(mm: number): number {
  return Math.round(mm * MESSAGE_SCALE) / MESSAGE_SCALE;
}

/**
 * The garment's waist openings, one per declared waist line (bodice waist, skirt waist), each summed round the body.
 *
 * @param ctx - Finished context.
 * @returns Circumferences in mm, by body-line id.
 */
export function waistOpeningsMm(ctx: DraftContext): Map<string, number> {
  const sums = new Map<string, number>();
  for (const piece of ctx.pieces) {
    for (const line of piece.bodyLines.filter((l) => l.measurement === "waist")) {
      const lengthMm = bodyLineLengthMm(piece, line) ?? 0;
      sums.set(line.id, (sums.get(line.id) ?? 0) + lengthMm * bodyLineMultiplier(piece));
    }
  }
  return sums;
}

/**
 * The hip-opening check: the narrowest waist opening against the hip plus the pass ease.
 *
 * @param ctx - Finished context.
 * @returns One FR-VAL-08 check.
 */
function hipOpeningCheck(ctx: DraftContext): ValidationCheck {
  const entries = [...waistOpeningsMm(ctx).entries()].sort(([, a], [, b]) => a - b);
  const [lineId, openingMm] = entries[0]!;
  const hipMm = ctx.measurements.hip + HIP_PASS_EASE_MM;
  const fits = openingMm >= hipMm;
  const code = fits ? "CLOSURE_HIP_OPENING_OK" : "CLOSURE_HIP_OPENING_TIGHT";
  return {
    id: "FR-VAL-08",
    code,
    status: fits ? "pass" : "warn",
    message: formatMessage(code, { mm: shown(openingMm), expected: shown(hipMm) }),
    measuredMm: openingMm,
    expectedMm: hipMm,
    refs: [`body-line:${lineId}`],
  };
}

/**
 * Whether the rule applies: no closure on a dress, or on a skirt the waistband module does not finish, with a waist
 * line to measure. A blouse goes on over the head (the neck rule).
 *
 * @param ctx - Finished context.
 * @returns True when the waist must pass over the hips.
 */
function needsHipOpening(ctx: DraftContext): boolean {
  const { spec } = ctx;
  const covered = spec.category === "blouse" || (spec.category === "skirt" && spec.waistband !== undefined);
  return spec.closure.type === "none" && !covered && waistOpeningsMm(ctx).size > 0;
}

/** A garment with no closure must pass over the hips at its waist (FR-VAL-08). */
export const hipOpeningRule: ValidationRule = {
  id: "FR-VAL-08",
  code: "CLOSURE_HIP_OPENING_TIGHT",
  appliesTo: needsHipOpening,
  run: hipOpeningCheck,
};

/** Every closure rule. */
export const CLOSURE_RULES: readonly ValidationRule[] = [hipOpeningRule];
