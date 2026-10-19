/** Paired seam-length validation (FR-VAL-01). */
import type { Edge, ValidationCheck } from "@tafsila/schemas";
import { SEAM_MATCH_TOLERANCE_MM } from "../../constants/validation";
import { edgeRef, uniqueEdgePairs } from "../../pieces/edge-pairs";
import { edgeLengthMm } from "../../pieces/measure";
import type { DraftContext, PieceDraft } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../messages";

/**
 * Finds one edge by its full report reference.
 *
 * @param ctx - Finished drafting context.
 * @param ref - `piece/edge` reference.
 * @returns The piece and edge, or undefined for a broken reference.
 */
function findEdge(ctx: DraftContext, ref: string): { piece: PieceDraft; edge: Edge } | undefined {
  const slash = ref.indexOf("/");
  const piece = ctx.pieces.find((candidate) => candidate.id === ref.slice(0, slash));
  const edge = piece?.edges.find((candidate) => candidate.id === ref.slice(slash + 1));
  return piece && edge ? { piece, edge } : undefined;
}

/**
 * Validates every unique paired seam against its declared ease.
 *
 * @param ctx - Finished drafting context.
 * @returns One check per paired seam.
 */
function seamChecks(ctx: DraftContext): readonly ValidationCheck[] {
  return uniqueEdgePairs(ctx.pieces).map(({ piece, edge, targetRef }) => {
    const sourceRef = edgeRef(piece.id, edge.id);
    const target = findEdge(ctx, targetRef);
    if (!target) {
      return {
        id: "FR-VAL-01",
        code: "SEAM_MATCH_BROKEN_REF",
        status: "fail",
        message: formatMessage("SEAM_MATCH_BROKEN_REF", { first: sourceRef, second: targetRef }),
        refs: [sourceRef, targetRef],
      };
    }
    const measuredMm =
      edgeLengthMm(piece, edge.id, { closeDarts: true }) -
      edgeLengthMm(target.piece, target.edge.id, { closeDarts: true });
    const expectedMm = edge.pairsWith?.intendedEaseMm ?? 0;
    const passes = Math.abs(measuredMm - expectedMm) <= SEAM_MATCH_TOLERANCE_MM;
    const code = passes ? "SEAM_MATCH_OK" : "SEAM_MATCH_MISMATCH";
    return {
      id: "FR-VAL-01",
      code,
      status: passes ? "pass" : "fail",
      message: formatMessage(code, {
        first: sourceRef,
        second: targetRef,
        mm: measuredMm,
        expected: expectedMm,
      }),
      measuredMm,
      expectedMm,
      refs: [sourceRef, targetRef],
    };
  });
}

/** Validates every unique paired seam against its declared ease. */
export const seamMatchRule: ValidationRule = {
  id: "FR-VAL-01",
  code: "SEAM_MATCH_MISMATCH",
  appliesTo: (ctx) => ctx.pieces.some((piece) => piece.edges.some((edge) => edge.pairsWith !== undefined)),
  run: (ctx) => seamChecks(ctx)[0]!,
  runMany: seamChecks,
};

/** Core paired-seam rules. */
export const SEAM_MATCH_RULES: readonly ValidationRule[] = [seamMatchRule];
