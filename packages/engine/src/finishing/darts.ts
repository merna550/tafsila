/**
 * Finishing sub-step: checks the darts a block recorded (FR-PAT-02, issue #131).
 * A dart carries its two legs, its apex and the edge it opens from. The fold direction is the rule
 * "towards the centre line" (docs/engine/README.md), so nothing more is stored; this only catches drafting bugs.
 */
import type { Dart, Point } from "@tafsila/schemas";
import { INTERIOR_DART_EDGE_ID } from "../constants/assembly";
import { DART_LEG_TOLERANCE_MM } from "../constants/labels";
import { DraftingError } from "../errors/drafting-error";
import { distancePointToPolyline, pointInPolygon, samplePath } from "../geometry";
import { type PieceDraft, type Step, withPieces } from "../pipeline/draft-context";

/**
 * Checks a dart that lies inside the piece (a fisheye half, #144): its apex and legs are inside the outline.
 *
 * @param piece - The piece.
 * @param dart - The dart.
 * @param outline - The sampled outline.
 * @throws {DraftingError} FINISHING_DART_APEX_OUTSIDE when a point is outside.
 */
function assertInside(piece: PieceDraft, dart: Dart, outline: readonly Point[]): void {
  if ([dart.apex, ...dart.legs].some((p) => !pointInPolygon(p, outline))) {
    throw new DraftingError(
      "FINISHING_DART_APEX_OUTSIDE",
      `Interior dart ${piece.id}/${dart.id} is not inside the piece`,
    );
  }
}

/**
 * Checks every dart of a piece.
 *
 * @param piece - The piece.
 * @throws {DraftingError} FINISHING_DART_EDGE_MISSING, FINISHING_DART_LEG_OFF_EDGE or FINISHING_DART_APEX_OUTSIDE.
 */
function assertDarts(piece: PieceDraft): void {
  const outline = samplePath(piece.stitchPath);
  for (const dart of piece.darts) {
    if (dart.edgeId === INTERIOR_DART_EDGE_ID) {
      assertInside(piece, dart, outline);
      continue;
    }
    const edge = piece.edges.find((e) => e.id === dart.edgeId);
    if (!edge) {
      throw new DraftingError(
        "FINISHING_DART_EDGE_MISSING",
        `Dart ${piece.id}/${dart.id} names unknown edge ${dart.edgeId}`,
      );
    }
    const edgePoints = samplePath(piece.stitchPath.slice(edge.fromSegment, edge.toSegment + 1));
    if (dart.legs.some((leg) => distancePointToPolyline(leg, edgePoints) > DART_LEG_TOLERANCE_MM)) {
      throw new DraftingError(
        "FINISHING_DART_LEG_OFF_EDGE",
        `A leg of dart ${piece.id}/${dart.id} is not on edge ${edge.id}`,
      );
    }
    if (!pointInPolygon(dart.apex, outline)) {
      throw new DraftingError(
        "FINISHING_DART_APEX_OUTSIDE",
        `The apex of dart ${piece.id}/${dart.id} is outside the piece`,
      );
    }
  }
}

/**
 * The dart step: validates the darts, changes nothing.
 *
 * @param ctx - Current context.
 * @returns The new context.
 */
export const dartStep: Step = (ctx) => {
  ctx.pieces.forEach(assertDarts);
  return withPieces(ctx, ctx.pieces);
};
