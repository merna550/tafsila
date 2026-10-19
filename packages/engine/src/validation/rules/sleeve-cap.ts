/** Woven sleeve-cap ease validation (FR-VAL-02), with declared gathers and unsewn armhole (issue #142). */
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
 * Sum of the lengths of found edges, with darts closed.
 *
 * @param refs - Resolved edge references (all found).
 * @returns Total length in mm.
 */
function totalLengthMm(refs: readonly { readonly found: ReturnType<typeof referencedEdge> }[]): number {
  return refs.reduce(
    (sum, { found }) => sum + edgeLengthMm(found!.piece, found!.edge.id, { closeDarts: true }),
    0,
  );
}

/**
 * Builds one report row per declared sleeve cap. A cap may declare a length it gathers on purpose (a puff head) and an
 * armhole length it is not sewn to (a cap or flutter sleeve); both are taken out before the ease is measured, so the
 * net ease is still held to 10 to 40 mm (decision 142, 4).
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
      const caps = declaration.edgeIds.map((edgeId) => ({
        ref: `${piece.id}/${edgeId}`,
        found: referencedEdge(ctx, piece.id, edgeId),
      }));
      const armholes = declaration.armholeRefs.map((ref) => ({
        ref: `${ref.pieceId}/${ref.edgeId}`,
        found: referencedEdge(ctx, ref.pieceId, ref.edgeId),
      }));
      const broken = [...caps, ...armholes].find(({ found }) => !found)?.ref;
      const refs = [...caps, ...armholes].map(({ ref }) => ref);
      if (broken) {
        return {
          id: "FR-VAL-02",
          code: "SLEEVE_CAP_BROKEN_REF",
          status: "fail",
          message: formatMessage("SLEEVE_CAP_BROKEN_REF", { ref: broken }),
          refs,
        };
      }
      const capLengthMm = totalLengthMm(caps) - (declaration.gatheredMm ?? 0);
      const armholeLengthMm = totalLengthMm(armholes) - (declaration.armholeExcludedMm ?? 0);
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
