/** Belt validation (issue #145, FR-VAL-01): the parts joined end to end make the finished length. */
import type { ValidationCheck } from "@tafsila/schemas";
import { BELT_LENGTH_TOLERANCE_MM } from "../../constants/belt";
import { edgeLengthMm } from "../../pieces/measure";
import { STRIP_SEAM_EDGE_PREFIX } from "../../pieces/strip";
import type { DraftContext } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage, shownMm } from "../../validation/messages";
import { BELT_ID, beltLengthMm } from "./belt";

/**
 * Whether a piece is a belt part.
 *
 * @param id - Piece id.
 * @returns True for `belt` and `belt-n`.
 */
function isBeltPart(id: string): boolean {
  return id === BELT_ID || /^belt-\d+$/.test(id);
}

/**
 * The belt-length check.
 *
 * @param ctx - Finished context.
 * @returns One FR-VAL-01 check.
 */
function beltLengthCheck(ctx: DraftContext): ValidationCheck {
  const parts = ctx.pieces.filter((p) => isBeltPart(p.id));
  const measuredMm = parts.reduce((sum, p) => sum + edgeLengthMm(p, `${STRIP_SEAM_EDGE_PREFIX}1`), 0);
  const expectedMm = beltLengthMm(ctx.measurements.waist);
  const ok = Math.abs(measuredMm - expectedMm) <= BELT_LENGTH_TOLERANCE_MM;
  const code = ok ? "BELT_LENGTH_OK" : "BELT_LENGTH_MISMATCH";
  return {
    id: "FR-VAL-01",
    code,
    status: ok ? "pass" : "fail",
    message: formatMessage(code, { mm: shownMm(measuredMm), expected: shownMm(expectedMm) }),
    measuredMm,
    expectedMm,
    refs: parts.map((p) => p.id),
  };
}

/** The parts of the belt add up to its finished length. */
export const beltLengthRule: ValidationRule = {
  id: "FR-VAL-01",
  code: "BELT_LENGTH_MISMATCH",
  appliesTo: (ctx) => ctx.pieces.some((p) => isBeltPart(p.id)),
  run: beltLengthCheck,
};
