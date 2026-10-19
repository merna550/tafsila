/** The straight skirt block as a feature module (issue #129): adds `skirt-front` and `skirt-back` to the context. */
import type { Piece } from "@tafsila/schemas";
import { SKIRT_GRAIN_LINE_SHARE } from "../../constants/skirt-block";
import { isPanelSkirt } from "../../constants/skirt-fullness";
import { pt } from "../../geometry";
import { type DraftContext, type PieceDraft, withPiece } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { closureOpensAt } from "../../pieces/closure-opening";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import { type SkirtHalf, SKIRT_PIECE_ID, SKIRT_PIECE_NAME } from "./edges";
import { draftSkirtHalf, type SkirtDraftInputs } from "./draft-skirt-half";

/**
 * How a half is cut: the front always on the fold; the back on the fold, or as a mirrored pair with a centre-back seam.
 *
 * @param half - Front or back.
 * @param centreSeam - True for a centre-back seam.
 * @returns The cut instructions.
 */
function cutFor(half: SkirtHalf, centreSeam: boolean): Piece["cut"] {
  return half === "back" && centreSeam
    ? { quantity: 2, onFold: false, mirror: true, fabric: "main" }
    : { quantity: 1, onFold: true, mirror: false, fabric: "main" };
}

/**
 * Builds one skirt piece from its draft.
 *
 * @param half - Front or back.
 * @param measurements - Body measurements.
 * @param inputs - Resolved inputs.
 * @param centreSeam - True for a centre-back seam.
 * @returns The piece, ready for the finishing step.
 */
function skirtPiece(
  half: SkirtHalf,
  measurements: DraftContext["measurements"],
  inputs: SkirtDraftInputs,
  centreSeam: boolean,
): PieceDraft {
  const draft = draftSkirtHalf({ half, measurements, inputs, centreSeam });
  const hip = draft.keyPoints[`skirt.${half}.hipSide`]!;
  const hem = draft.keyPoints[`skirt.${half}.hemSide`]!;
  const grainXMm = hip.x / 2;
  const span = hem.y - hip.y;
  return {
    id: SKIRT_PIECE_ID[half],
    name: SKIRT_PIECE_NAME[half],
    cut: cutFor(half, centreSeam),
    stitchPath: draft.stitchPath,
    edges: draft.edges,
    notches: [],
    bodyLines: [
      { id: "skirt-waist", measurement: "waist", kind: "edge", edgeId: "waist" },
      { id: "skirt-hip", measurement: "hip", kind: "horizontal", atMm: hip.y },
    ],
    grainLine: [
      pt(grainXMm, hip.y + span * SKIRT_GRAIN_LINE_SHARE.from),
      pt(grainXMm, hip.y + span * SKIRT_GRAIN_LINE_SHARE.to),
    ],
    darts: draft.darts,
  };
}

/**
 * Straight skirt block module. Calls `resolveDraftInputs` itself while the pipeline's resolve step is a stub
 * (decision 129-skirt-block, 2). Applies to every design with a skirt except the panel skirts (gathered, pleated,
 * tiered), which are rectangles and do not start from this block (decision 137).
 */
export const skirtBlockModule: FeatureModule = {
  id: "block-skirt",
  order: 10,
  appliesTo: (spec) => spec.skirt !== undefined && !isPanelSkirt(spec.skirt.type),
  draft: (ctx) => {
    const inputs = resolveDraftInputs(ctx.spec, ctx.measurements, ctx.options);
    const centreSeam = closureOpensAt(ctx.spec.closure, "center-back");
    const halves: readonly SkirtHalf[] = ["front", "back"];
    return halves.reduce(
      (acc, half) => withPiece(acc, skirtPiece(half, ctx.measurements, inputs, centreSeam)),
      ctx,
    );
  },
};
