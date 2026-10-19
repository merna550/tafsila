/**
 * Cuff rule (issue #142, decision 142, 5): the cuff's sewn edge against the sleeve hem after its gathers (FR-VAL-01,
 * ± 2 mm), the wrist overlap declared apart. Mirrors the waistband length rule (#140).
 */
import type { ValidationCheck } from "@tafsila/schemas";
import { SLEEVE_EDGE, SLEEVE_PIECE_ID } from "../../blocks/sleeve/ids";
import { SEAM_MATCH_TOLERANCE_MM } from "../../constants/validation";
import { edgeLengthMm } from "../../pieces/measure";
import type { DraftContext, PieceDraft } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../../validation/messages";

/** Keys of the numbers the cuff module passes to its rule. */
export const CUFF_KEYS = { overlapMm: "cuff.overlapMm" } as const;

/**
 * Length of the cuff edges that sew to the sleeve hem, measured on the cuff pieces.
 *
 * @param ctx - Finished context.
 * @returns Length in mm.
 */
export function cuffSeamLengthMm(ctx: DraftContext): number {
  return ctx.pieces
    .filter((piece) => piece.id !== SLEEVE_PIECE_ID)
    .flatMap((piece) =>
      piece.edges
        .filter((e) => e.pairsWith?.pieceId === SLEEVE_PIECE_ID && e.pairsWith.edgeId === SLEEVE_EDGE.hem)
        .map((e) => edgeLengthMm(piece, e.id)),
    )
    .reduce((sum, mm) => sum + mm, 0);
}

/**
 * The sleeve hem as the cuff sews to it: gathered to its mark, or relaxed (an elastic casing gathers it later).
 *
 * @param sleeve - The sleeve piece.
 * @returns Length in mm.
 */
export function sewnHemMm(sleeve: PieceDraft): number {
  const gather = (sleeve.marks ?? []).find((m) => m.kind === "gather" && m.edgeId === SLEEVE_EDGE.hem);
  return gather?.lengthMm ?? edgeLengthMm(sleeve, SLEEVE_EDGE.hem);
}

/**
 * The cuff length check.
 *
 * @param ctx - Finished context.
 * @returns One FR-VAL-01 check.
 */
function cuffLengthCheck(ctx: DraftContext): ValidationCheck {
  const sleeve = ctx.pieces.find((p) => p.id === SLEEVE_PIECE_ID);
  const measuredMm = cuffSeamLengthMm(ctx);
  const expectedMm = sleeve ? sewnHemMm(sleeve) : 0;
  const passes = sleeve !== undefined && Math.abs(measuredMm - expectedMm) <= SEAM_MATCH_TOLERANCE_MM;
  const code = passes ? "CUFF_LENGTH_OK" : "CUFF_LENGTH_MISMATCH";
  const values = { mm: measuredMm, expected: expectedMm, overlap: ctx.resolved[CUFF_KEYS.overlapMm] ?? 0 };
  return {
    id: "FR-VAL-01",
    code,
    status: passes ? "pass" : "fail",
    message: formatMessage(
      code,
      Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Math.round(v)])),
    ),
    measuredMm,
    expectedMm,
  };
}

/** The cuff sews to the gathered sleeve hem within 2 mm; the wrist overlap is declared, not a mismatch. */
export const cuffLengthRule: ValidationRule = {
  id: "FR-VAL-01",
  code: "CUFF_LENGTH_MISMATCH",
  appliesTo: (ctx) => ctx.resolved[CUFF_KEYS.overlapMm] !== undefined,
  run: cuffLengthCheck,
};

/** Every cuff rule. */
export const CUFF_RULES: readonly ValidationRule[] = [cuffLengthRule];
