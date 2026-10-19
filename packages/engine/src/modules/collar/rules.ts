/**
 * Collar rules (issue #141, decision 141, 10): the collar neck edge against the bodice neck, front plus back, within
 * 2 mm (FR-VAL-01). Each half seam and each notch is also checked by the core seam and notch rules; this rule reports
 * the whole neck in one line and never changes the geometry.
 */
import type { ValidationCheck } from "@tafsila/schemas";
import { SEAM_MATCH_TOLERANCE_MM } from "../../constants/validation";
import type { DraftContext } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../../validation/messages";

/** Keys of the numbers the module passes to its rule. */
export const COLLAR_KEYS = {
  neckMm: "collar.neckMm",
  bodiceNeckMm: "collar.bodiceNeckMm",
} as const;

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
 * The collar neck length check.
 *
 * @param ctx - Finished context.
 * @returns One FR-VAL-01 check.
 */
function neckLengthCheck(ctx: DraftContext): ValidationCheck {
  const measuredMm = ctx.resolved[COLLAR_KEYS.neckMm] ?? 0;
  const expectedMm = ctx.resolved[COLLAR_KEYS.bodiceNeckMm] ?? 0;
  const passes = Math.abs(measuredMm - expectedMm) <= SEAM_MATCH_TOLERANCE_MM;
  const code = passes ? "COLLAR_NECK_LENGTH_OK" : "COLLAR_NECK_LENGTH_MISMATCH";
  return {
    id: "FR-VAL-01",
    code,
    status: passes ? "pass" : "fail",
    message: formatMessage(code, { mm: shown(measuredMm), expected: shown(expectedMm) }),
    measuredMm,
    expectedMm,
  };
}

/** The collar neck edge equals the bodice neck within 2 mm. */
export const collarNeckLengthRule: ValidationRule = {
  id: "FR-VAL-01",
  code: "COLLAR_NECK_LENGTH_MISMATCH",
  appliesTo: (ctx) => ctx.resolved[COLLAR_KEYS.neckMm] !== undefined,
  run: neckLengthCheck,
};

/** Every collar rule. */
export const COLLAR_RULES: readonly ValidationRule[] = [collarNeckLengthRule];
