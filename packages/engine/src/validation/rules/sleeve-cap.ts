/** Woven set-in sleeve-cap ease validation (FR-VAL-02). */
import type { ValidationCheck } from "@tafsila/schemas";
import { SLEEVE_CAP_EASE_MAX_MM, SLEEVE_CAP_EASE_MIN_MM } from "../../constants/validation";
import { edgeLengthMm } from "../../pieces/measure";
import type { DraftContext } from "../../pipeline/draft-context";
import type { ValidationRule } from "../../pipeline/feature-module";
import { formatMessage } from "../messages";

/**
 * Finds a piece and edge named by one sleeve-cap reference.
 *
 * @param ctx - Finished drafting context.
 * @param pieceId - Referenced piece id.
 * @param edgeId - Referenced edge id.
 * @returns The piece and edge, or undefined for a broken reference.
 */
function referencedEdge(ctx: DraftContext, pieceId: string, edgeId: string) {
  const piece = ctx.pieces.find((candidate) => candidate.id === pieceId);
  const edge = piece?.edges.find((candidate) => candidate.id === edgeId);
  return piece && edge ? { piece, edge } : undefined;
}

/**
 * Builds one report row per declared sleeve cap.
 *
 * @param ctx - Finished drafting context.
 * @returns Sleeve-cap validation checks.
 */
function sleeveCapChecks(ctx: DraftContext): readonly ValidationCheck[] {
  return ctx.pieces
    .filter((piece) => piece.sleeveCap !== undefined)
    .sort((a, b) => a.id.localeCompare(b.id, "en"))
    .map((piece) => {
      const declaration = piece.sleeveCap!;
      const capRef = `${piece.id}/${declaration.edgeId}`;
      const capEdge = referencedEdge(ctx, piece.id, declaration.edgeId);
      const armholes = declaration.armholeRefs.map((ref) => ({
        ref: `${ref.pieceId}/${ref.edgeId}`,
        found: referencedEdge(ctx, ref.pieceId, ref.edgeId),
      }));
      const broken = !capEdge ? capRef : armholes.find(({ found }) => !found)?.ref;
      const refs = [capRef, ...armholes.map(({ ref }) => ref)];
      if (broken) {
        return {
          id: "FR-VAL-02",
          code: "SLEEVE_CAP_BROKEN_REF",
          status: "fail",
          message: formatMessage("SLEEVE_CAP_BROKEN_REF", { ref: broken }),
          refs,
        };
      }
      const capLengthMm = edgeLengthMm(capEdge!.piece, capEdge!.edge.id, { closeDarts: true });
      const armholeLengthMm = armholes.reduce(
        (sum, armhole) =>
          sum + edgeLengthMm(armhole.found!.piece, armhole.found!.edge.id, { closeDarts: true }),
        0,
      );
      const measuredMm = capLengthMm - armholeLengthMm;
      const passes = measuredMm >= SLEEVE_CAP_EASE_MIN_MM && measuredMm <= SLEEVE_CAP_EASE_MAX_MM;
      const code = passes ? "SLEEVE_CAP_OK" : "SLEEVE_CAP_OUT_OF_RANGE";
      return {
        id: "FR-VAL-02",
        code,
        status: passes ? "pass" : "fail",
        message: formatMessage(code, {
          mm: measuredMm,
          min: SLEEVE_CAP_EASE_MIN_MM,
          max: SLEEVE_CAP_EASE_MAX_MM,
        }),
        measuredMm,
        expectedMm: SLEEVE_CAP_EASE_MIN_MM,
        refs,
      };
    });
}

/** Validates every declared sleeve cap against the armhole edges it joins. */
export const sleeveCapRule: ValidationRule = {
  id: "FR-VAL-02",
  code: "SLEEVE_CAP_OUT_OF_RANGE",
  appliesTo: (ctx) =>
    ctx.spec.fabricType === "woven" && ctx.pieces.some((piece) => piece.sleeveCap !== undefined),
  run: (ctx) => sleeveCapChecks(ctx)[0]!,
  runMany: sleeveCapChecks,
};

/** Core sleeve-cap rules. */
export const SLEEVE_CAP_RULES: readonly ValidationRule[] = [sleeveCapRule];
