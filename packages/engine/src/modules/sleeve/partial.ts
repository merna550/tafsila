/**
 * What the cap sleeve and the flutter share (issue #142, decision 142, 3): both are sewn into the armhole between the
 * back and front balance notches only. The sleeve carries the shoulder notch; the bodice keeps the shoulder notch and
 * gets a `sleeve-end` mark at each balance-notch position, as notches there would have no partner on the sleeve; the
 * rest of the armhole is bound (#146). The cap declares the armhole it is not sewn to (FR-VAL-02).
 */
import type { EngineOptions, Mark } from "@tafsila/schemas";
import { buildEdges, type EdgeSpec } from "../../blocks/shared/edges";
import type { BodiceArmholeParts } from "../../blocks/bodice/armhole-parts";
import { BODICE_ARMHOLE_EDGE, SLEEVE_EDGE } from "../../blocks/sleeve/ids";
import { shoulderArmholeNotch, sleeveShoulderNotch } from "../../blocks/sleeve/notches";
import { withArmholeNotches } from "../../blocks/sleeve/module";
import {
  SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM,
  SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM,
} from "../../constants/sleeve-block";
import { DraftingError } from "../../errors/drafting-error";
import { pointAtLength, type Point, type Segment } from "../../geometry";
import { PIECE_NAMES } from "../../i18n/pieces";
import { edgeLengthMm, edgeSegments } from "../../pieces/measure";
import { type DraftContext, type PieceDraft, withPiece } from "../../pipeline/draft-context";

/** Armhole length below the two balance notches, which a cap or flutter sleeve does not cover. */
export const PARTIAL_ARMHOLE_EXCLUDED_MM =
  SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM + SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM;

/** A cap or flutter sleeve outline: the two cap halves sewn to the armhole, then the rest of the outline. */
export interface PartialSleeveSpec {
  /** Piece id. */
  readonly id: string;
  /** Copies cut (a self-lined cap sleeve is cut four times). */
  readonly quantity: number;
  /** Back cap, back notch to shoulder point. */
  readonly capBack: readonly Segment[];
  /** Front cap, shoulder point to front notch. */
  readonly capFront: readonly Segment[];
  /** The rest of the outline, front notch round to back notch, and its edges. */
  readonly rest: readonly Segment[];
  /** Edges of the rest, in path order. */
  readonly restEdges: readonly EdgeSpec[];
  /** Grain line. */
  readonly grainLine: readonly [Point, Point];
}

/**
 * Builds a cap or flutter sleeve piece.
 *
 * @param spec - The outline and its edges.
 * @param armholes - Bodice pieces holding each armhole.
 * @param options - Engine options, for the seam allowances.
 * @returns The piece, cut as mirrored pairs.
 */
export function partialSleevePiece(
  spec: PartialSleeveSpec,
  armholes: BodiceArmholeParts,
  options: Pick<EngineOptions, "seamAllowance">,
): PieceDraft {
  const edges = buildEdges(
    spec.id,
    [
      { id: SLEEVE_EDGE.capBack, kind: "armhole", segments: spec.capBack.length },
      { id: SLEEVE_EDGE.capFront, kind: "armhole", segments: spec.capFront.length },
      ...spec.restEdges,
    ],
    options,
  );
  return {
    id: spec.id,
    name: PIECE_NAMES[spec.id]!,
    cut: { quantity: spec.quantity, onFold: false, mirror: true, fabric: "main" },
    stitchPath: [...spec.capBack, ...spec.capFront, ...spec.rest],
    edges,
    notches: [sleeveShoulderNotch(armholes)],
    bodyLines: [],
    sleeveCap: {
      edgeIds: [SLEEVE_EDGE.capBack, SLEEVE_EDGE.capFront],
      armholeRefs: [...armholes.back, ...armholes.front].map((pieceId) => ({
        pieceId,
        edgeId: BODICE_ARMHOLE_EDGE,
      })),
      armholeExcludedMm: PARTIAL_ARMHOLE_EXCLUDED_MM,
    },
    grainLine: [spec.grainLine[0], spec.grainLine[1]],
    darts: [],
  };
}

/**
 * Adds a `sleeve-end` mark to one bodice armhole, a given distance up from the underarm.
 *
 * @param ctx - Current context.
 * @param pieceId - Bodice piece holding the armhole part at the underarm.
 * @param fromUnderarmMm - Distance up from the underarm.
 * @param half - Which end of the sleeve.
 * @returns A new context.
 * @throws {DraftingError} PIPELINE_STEP_ORDER when the piece is missing.
 */
function withSleeveEndMark(
  ctx: DraftContext,
  pieceId: string,
  fromUnderarmMm: number,
  half: "back" | "front",
): DraftContext {
  const piece = ctx.pieces.find((p) => p.id === pieceId);
  if (!piece) throw new DraftingError("PIPELINE_STEP_ORDER", "The sleeve needs the bodice armhole");
  const atMm = edgeLengthMm(piece, BODICE_ARMHOLE_EDGE) - fromUnderarmMm;
  const mark: Mark = {
    id: `sleeve-end-${half}`,
    kind: "sleeve-end",
    shape: "point",
    edgeId: BODICE_ARMHOLE_EDGE,
    at: pointAtLength(edgeSegments(piece, BODICE_ARMHOLE_EDGE), atMm),
    text: { ar: "نهاية الكم", en: "Sleeve ends" },
  };
  return withPiece(ctx, { ...piece, marks: [...(piece.marks ?? []), mark] });
}

/**
 * Adds a cap or flutter sleeve to the context and marks the bodice armholes it is sewn into.
 *
 * @param ctx - Context after the bodice block.
 * @param sleeve - The cap or flutter sleeve piece.
 * @param armholes - Bodice pieces holding each armhole, shoulder tip first.
 * @returns The new context.
 * @throws {DraftingError} PIPELINE_STEP_ORDER when a bodice piece is missing.
 */
export function withPartialSleeve(
  ctx: DraftContext,
  sleeve: PieceDraft,
  armholes: BodiceArmholeParts,
): DraftContext {
  const shoulder = withArmholeNotches(ctx, armholes.front[0], () => [shoulderArmholeNotch(sleeve.id)]);
  const back = withSleeveEndMark(shoulder, armholes.back.at(-1)!, SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM, "back");
  const front = withSleeveEndMark(back, armholes.front.at(-1)!, SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM, "front");
  return withPiece(front, sleeve);
}
