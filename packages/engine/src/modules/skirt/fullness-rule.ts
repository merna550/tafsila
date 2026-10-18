/**
 * Waist closure of the panel skirts (issue #137, FR-VAL-03): the top edges, gathered to their gather marks and with
 * the pleat intakes folded away, must come to the finished waist (waist + total ease) within the circumference tolerance.
 */
import type { Mark, ValidationCheck } from "@tafsila/schemas";
import { CIRCUMFERENCE_TOLERANCE_MM } from "../../constants/validation";
import { distance } from "../../geometry";
import { bodyLineMultiplier } from "../../pieces/body-lines";
import { edgeLengthMm } from "../../pieces/measure";
import type { DraftContext, PieceDraft } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../../validation/messages";

/** The edge every panel skirt closes at. */
const WAIST_EDGE_ID = "waist";

/**
 * How much a mark changes the sewn length of its edge: a gather run becomes `lengthMm`; a pleat arrow folds its
 * own length away; other marks change nothing.
 *
 * @param mark - A mark on the waist edge.
 * @returns Change in mm (negative shortens).
 */
function closureChangeMm(mark: Mark): number {
  if (mark.shape === "point") return 0;
  const runMm = distance(mark.from, mark.to);
  if (mark.kind === "gather") return (mark.lengthMm ?? runMm) - runMm;
  return mark.kind === "pleat-direction" ? -runMm : 0;
}

/**
 * Sewn waist length of one piece after gathering and pleating.
 *
 * @param piece - A piece with a waist edge.
 * @returns Length in mm.
 */
export function closedWaistMm(piece: PieceDraft): number {
  const changeMm = (piece.marks ?? [])
    .filter((mark) => mark.edgeId === WAIST_EDGE_ID)
    .reduce((sum, mark) => sum + closureChangeMm(mark), 0);
  return edgeLengthMm(piece, WAIST_EDGE_ID, { closeDarts: true }) + changeMm;
}

/**
 * Checks the whole-garment closed waist against the finished waist.
 *
 * @param ctx - Finished drafting context.
 * @returns One FR-VAL-03 check.
 */
function fullnessCheck(ctx: DraftContext): ValidationCheck {
  const pieces = ctx.pieces.filter((piece) => piece.edges.some((edge) => edge.id === WAIST_EDGE_ID));
  const measuredMm = pieces.reduce((sum, piece) => sum + closedWaistMm(piece) * bodyLineMultiplier(piece), 0);
  const expectedMm = ctx.measurements.waist + ctx.inputs!.totalEaseMm.waist;
  const passes = Math.abs(measuredMm - expectedMm) <= CIRCUMFERENCE_TOLERANCE_MM;
  const code = passes ? "FULLNESS_CLOSURE_OK" : "FULLNESS_CLOSURE_MISMATCH";
  return {
    id: "FR-VAL-03",
    code,
    status: passes ? "pass" : "fail",
    message: formatMessage(code, { mm: Math.round(measuredMm), expected: Math.round(expectedMm) }),
    measuredMm,
    expectedMm,
    refs: pieces.map((piece) => `${piece.id}/${WAIST_EDGE_ID}`).sort((a, b) => a.localeCompare(b, "en")),
  };
}

/** The waist of a gathered, pleated or tiered skirt closes to waist + ease (± 5 mm). */
export const fullnessClosureRule: ValidationRule = {
  id: "FR-VAL-03",
  code: "FULLNESS_CLOSURE_MISMATCH",
  appliesTo: (ctx) =>
    ctx.inputs !== undefined &&
    ctx.pieces.some((piece) => piece.edges.some((edge) => edge.id === WAIST_EDGE_ID)),
  run: fullnessCheck,
};
