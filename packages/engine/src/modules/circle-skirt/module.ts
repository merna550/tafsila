/**
 * Half- and full-circle skirt module (issue #136, FR-PAT-05): replaces the straight block's `skirt-front` and
 * `skirt-back` with circle-skirt quarters of the same ids and edge names. Method and decisions:
 * `docs/engine/drafting-method.md` "Circle skirts", decision 136-circle-skirts.
 */
import type { DesignSpec, Piece } from "@tafsila/schemas";
import { type SkirtHalf, SKIRT_PIECE_ID, SKIRT_PIECE_NAME, skirtEdges } from "../../blocks/skirt/edges";
import type { CircleSkirtType } from "../../constants/circle-skirt";
import { DraftingError } from "../../errors/drafting-error";
import { type DraftContext, type PieceDraft, withPiece } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import { type CircleQuarterDraft, draftCircleQuarter } from "./draft";
import { type CircleLayout, chooseLayout } from "./split";

/** Quarter of a circumference: the skirt waist input is a quarter width. */
const QUARTER = 4;

/** The two halves, front first. */
const HALVES: readonly SkirtHalf[] = ["front", "back"];

/** The closure position that puts a seam on each half's centre line. */
const CENTRE_CLOSURE: Readonly<Record<SkirtHalf, DesignSpec["closure"]["position"]>> = {
  front: "center-front",
  back: "center-back",
};

/**
 * True for the circle skirt types.
 *
 * @param type - Skirt type of the spec.
 * @returns Whether the type is drafted by this module.
 */
export function isCircleSkirt(type: string | undefined): type is CircleSkirtType {
  return type === "circle-half" || type === "circle-full";
}

/**
 * Whether a half's centre line is a seam: always in the split layout, else only for a zip on that centre line.
 *
 * @param half - Front or back.
 * @param layout - Chosen layout.
 * @param closure - Closure position of the design.
 * @returns True for a centre seam.
 */
function hasCentreSeam(
  half: SkirtHalf,
  layout: CircleLayout,
  closure: DesignSpec["closure"]["position"],
): boolean {
  return layout === "centre-seams" || closure === CENTRE_CLOSURE[half];
}

/**
 * How a half is cut: once on the fold, or twice mirrored with a centre seam.
 *
 * @param centreSeam - True for a centre seam.
 * @returns The cut instructions.
 */
function cutFor(centreSeam: boolean): Piece["cut"] {
  return centreSeam
    ? { quantity: 2, onFold: false, mirror: true, fabric: "main" }
    : { quantity: 1, onFold: true, mirror: false, fabric: "main" };
}

/**
 * Builds one circle-skirt piece from the drafted quarter (front and back share the shape).
 *
 * @param half - Front or back.
 * @param quarter - The drafted quarter.
 * @param centreSeam - True for a centre seam.
 * @returns The piece, ready for the finishing step.
 */
export function circlePiece(half: SkirtHalf, quarter: CircleQuarterDraft, centreSeam: boolean): PieceDraft {
  return {
    id: SKIRT_PIECE_ID[half],
    name: SKIRT_PIECE_NAME[half],
    cut: cutFor(centreSeam),
    stitchPath: quarter.stitchPath,
    edges: skirtEdges(half, centreSeam, quarter.runs),
    notches: [],
    bodyLines: [{ id: "skirt-waist", measurement: "waist", kind: "edge", edgeId: "waist" }],
    grainLine: quarter.grainLine,
    darts: [],
  };
}

/**
 * Drafts the circle skirt and replaces the block's skirt pieces with it, split to fit the fabric.
 *
 * @param ctx - Context after the skirt block.
 * @returns The context with circle-skirt `skirt-front` and `skirt-back`.
 * @throws {DraftingError} SKIRT_LENGTH_MISSING without a resolved skirt length.
 */
function draftCircleSkirt(ctx: DraftContext): DraftContext {
  const inputs = ctx.inputs ?? resolveDraftInputs(ctx.spec, ctx.measurements, ctx.options);
  const type = ctx.spec.skirt?.type;
  if (!isCircleSkirt(type) || inputs.skirtLengthMm === undefined) {
    throw new DraftingError(
      "SKIRT_LENGTH_MISSING",
      "The circle skirt needs a skirt and a resolved skirt length",
    );
  }
  const quarter = draftCircleQuarter({
    type,
    finishedWaistMm: inputs.skirtWaistQuarterMm * QUARTER,
    skirtLengthMm: inputs.skirtLengthMm,
  });
  const closure = ctx.spec.closure.position;
  const chosen = chooseLayout(
    (layout) => HALVES.map((half) => circlePiece(half, quarter, hasCentreSeam(half, layout, closure))),
    ctx.options,
  );
  return chosen.pieces.reduce(withPiece, ctx);
}

/** Half- and full-circle skirts. Runs after the straight block (order 10) and replaces its two pieces. */
export const circleSkirtModule: FeatureModule = {
  id: "skirt-circle",
  order: 20,
  appliesTo: (spec) => isCircleSkirt(spec.skirt?.type),
  draft: draftCircleSkirt,
};
