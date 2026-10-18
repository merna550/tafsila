/**
 * The one-piece set-in sleeve block (issue #134, FR-PAT-05, FR-VAL-02). Aldrich 6th ed., ch. 2, "Sleeve block"
 * (docs/engine/drafting-method.md): grain line from the cap top, upper-arm line at the cap height, wrist at the
 * sleeve length. The cap height is solved against the bodice armhole (decision 134, 1).
 */
import type { Edge, EngineOptions, Point, Segment } from "@tafsila/schemas";
import { DEFAULT_SEAM_ALLOWANCE_MM } from "@tafsila/schemas";
import {
  SLEEVE_CAP_LENGTH_BELOW_UNDERARM_MM,
  SLEEVE_CAP_TARGET_EASE_MM,
  SLEEVE_ELBOW_BELOW_HALF_LENGTH_MM,
  SLEEVE_GRAIN_END_INSET_MM,
  SLEEVE_LENGTH_SHARE,
  SLEEVE_MIN_UNDERARM_SEAM_MM,
  SLEEVE_SHORT_BELOW_UNDERARM_MM,
} from "../../constants/sleeve-block";
import { DraftingError } from "../../errors/drafting-error";
import { lerp, lineSeg, mapSegment, pathLength, pt, reversePath, splitAtLength } from "../../geometry";
import { halfCapSegments, solveSleeveCapHeight } from "../../sleeve/sleeve-cap";
import type { PieceDraft } from "../../pipeline/draft-context";
import { buildEdges, type EdgeSpec } from "../shared/edges";
import { BACK_PIECE_ID, FRONT_PIECE_ID } from "../bodice/piece-parts";
import { BODICE_ARMHOLE_EDGE, SLEEVE_EDGE, SLEEVE_PIECE_ID } from "./ids";
import { sleeveCapNotches } from "./notches";
import type { SleeveDraft, SleeveInput, SleeveKeyPoint, SleeveLength } from "./types";

/** Seam allowances used when `draftSleeve` is called without options. */
const DEFAULT_SEAM_OPTIONS: Pick<EngineOptions, "seamAllowance"> = {
  seamAllowance: { defaultsMm: DEFAULT_SEAM_ALLOWANCE_MM, perEdgeMm: {} },
};

/** Hem y of each length option from the cap height and the arm length (decision 134, 5). */
const HEM_Y_MM: Readonly<Record<SleeveLength, (capHeightMm: number, armLengthMm: number) => number>> = {
  cap: (capHeightMm) => capHeightMm + SLEEVE_CAP_LENGTH_BELOW_UNDERARM_MM,
  short: (capHeightMm) => capHeightMm + SLEEVE_SHORT_BELOW_UNDERARM_MM,
  elbow: (_, armLengthMm) => elbowYMm(armLengthMm),
  "three-quarter": (_, armLengthMm) => armLengthMm * SLEEVE_LENGTH_SHARE.threeQuarter,
  long: (_, armLengthMm) => armLengthMm * SLEEVE_LENGTH_SHARE.long,
};

/**
 * y of the elbow line: half the sleeve length plus 3 cm (Aldrich 6th ed., ch. 2, "Sleeve block").
 *
 * @param armLengthMm - Shoulder to wrist.
 * @returns The elbow line y.
 */
export function elbowYMm(armLengthMm: number): number {
  return armLengthMm / 2 + SLEEVE_ELBOW_BELOW_HALF_LENGTH_MM;
}

/**
 * Hem line y for a length option, checked against the underarm line.
 *
 * @param length - Length option.
 * @param capHeightMm - Solved cap height.
 * @param armLengthMm - Shoulder to wrist.
 * @returns The hem y.
 * @throws {DraftingError} SLEEVE_LENGTH_TOO_SHORT when the underarm seam would be shorter than the minimum.
 */
export function sleeveHemYMm(length: SleeveLength, capHeightMm: number, armLengthMm: number): number {
  const hemYMm = HEM_Y_MM[length](capHeightMm, armLengthMm);
  if (hemYMm - capHeightMm < SLEEVE_MIN_UNDERARM_SEAM_MM) {
    throw new DraftingError(
      "SLEEVE_LENGTH_TOO_SHORT",
      `A ${length} sleeve ends ${hemYMm - capHeightMm} mm below the underarm (minimum ${SLEEVE_MIN_UNDERARM_SEAM_MM})`,
    );
  }
  return hemYMm;
}

/**
 * The whole cap from the back underarm over the cap top to the front underarm: the S-curve half mirrored to the
 * back (-x) and run forwards, then the front half run backwards.
 *
 * @param bicepHalfMm - Half the sleeve width at the upper arm.
 * @param capHeightMm - Cap height.
 * @returns Four cubics, back underarm to front underarm.
 */
function wholeCap(bicepHalfMm: number, capHeightMm: number): Segment[] {
  const front = halfCapSegments(bicepHalfMm, capHeightMm);
  const back = front.map((seg) => mapSegment(seg, (p) => pt(-p.x, p.y)));
  return [...back, ...reversePath(front)];
}

/**
 * Point of the front underarm seam (underarm to long-sleeve wrist) at a given y.
 *
 * @param underarm - Front underarm point.
 * @param wrist - Front wrist point.
 * @param yMm - Height on the sleeve.
 * @returns The point on the seam line.
 */
function seamPointAt(underarm: Point, wrist: Point, yMm: number): Point {
  return lerp(underarm, wrist, (yMm - underarm.y) / (wrist.y - underarm.y));
}

/**
 * Mirrors a front point to the back of the sleeve.
 *
 * @param p - Point at +x.
 * @returns The same point at -x.
 */
function toBack(p: Point): Point {
  return pt(-p.x, p.y);
}

/**
 * Key points of the sleeve.
 *
 * @param input - Sleeve input.
 * @param capHeightMm - Solved cap height.
 * @param hemYMm - Hem line y.
 * @param shoulderPoint - Shoulder point on the cap.
 * @returns Every key point by name.
 */
function sleeveKeyPoints(
  input: SleeveInput,
  capHeightMm: number,
  hemYMm: number,
  shoulderPoint: Point,
): Record<SleeveKeyPoint, Point> {
  const underarm = pt(input.bicepHalfMm, capHeightMm);
  const wrist = pt(input.wristHalfMm, input.armLengthMm);
  const elbow = seamPointAt(underarm, wrist, elbowYMm(input.armLengthMm));
  const hem = seamPointAt(underarm, wrist, hemYMm);
  return {
    "sleeve.capTop": pt(0, 0),
    "sleeve.shoulderPoint": shoulderPoint,
    "sleeve.underarmBack": toBack(underarm),
    "sleeve.underarmFront": underarm,
    "sleeve.elbowBack": toBack(elbow),
    "sleeve.elbowFront": elbow,
    "sleeve.hemBack": toBack(hem),
    "sleeve.hemFront": hem,
    "sleeve.wristBack": toBack(wrist),
    "sleeve.wristFront": wrist,
    "sleeve.wristCentre": pt(0, input.armLengthMm),
  };
}

/**
 * The pairing of one underarm seam half with the other (they run in opposite directions).
 *
 * @param edgeId - The other underarm edge.
 * @returns The pair declaration.
 */
function underarmPair(edgeId: string): EdgeSpec["pairsWith"] {
  return { pieceId: SLEEVE_PIECE_ID, edgeId, reversed: true };
}

/**
 * Edges of the sleeve in path order. Each cap half declares to its bodice armhole the share of the target ease
 * that follows its armhole length; the two underarm seams pair with each other (decision 134, 2).
 *
 * @param segments - Segment counts of the two cap halves.
 * @param segments.capBack - Segments in the back cap.
 * @param segments.capFront - Segments in the front cap.
 * @param backShare - Back armhole length over the whole armhole.
 * @param options - Engine options, for the seam allowances.
 * @returns The five edges.
 */
function sleeveEdges(
  segments: { readonly capBack: number; readonly capFront: number },
  backShare: number,
  options: Pick<EngineOptions, "seamAllowance">,
): Edge[] {
  const backEaseMm = SLEEVE_CAP_TARGET_EASE_MM * backShare;
  return buildEdges(
    SLEEVE_PIECE_ID,
    [
      {
        id: SLEEVE_EDGE.capBack,
        kind: "armhole",
        segments: segments.capBack,
        pairsWith: {
          pieceId: BACK_PIECE_ID,
          edgeId: BODICE_ARMHOLE_EDGE,
          intendedEaseMm: backEaseMm,
          reversed: true,
        },
      },
      {
        id: SLEEVE_EDGE.capFront,
        kind: "armhole",
        segments: segments.capFront,
        pairsWith: {
          pieceId: FRONT_PIECE_ID,
          edgeId: BODICE_ARMHOLE_EDGE,
          intendedEaseMm: SLEEVE_CAP_TARGET_EASE_MM - backEaseMm,
        },
      },
      {
        id: SLEEVE_EDGE.underarmFront,
        kind: "side",
        segments: 1,
        pairsWith: underarmPair(SLEEVE_EDGE.underarmBack),
      },
      { id: SLEEVE_EDGE.hem, kind: "hem", segments: 1 },
      {
        id: SLEEVE_EDGE.underarmBack,
        kind: "side",
        segments: 1,
        pairsWith: underarmPair(SLEEVE_EDGE.underarmFront),
      },
    ],
    options,
  );
}

/**
 * Builds the sleeve piece: cut as a mirrored pair, grain line on x = 0, cap declared against both armholes.
 *
 * @param stitchPath - Outline from the back underarm.
 * @param edges - The edges.
 * @param capFrontMm - Front cap edge length, for the notches.
 * @param hemYMm - Hem line y, for the grain line.
 * @returns The piece in progress.
 */
function sleevePiece(stitchPath: Segment[], edges: Edge[], capFrontMm: number, hemYMm: number): PieceDraft {
  return {
    id: SLEEVE_PIECE_ID,
    name: { ar: "الكم", en: "Sleeve" },
    cut: { quantity: 2, onFold: false, mirror: true, fabric: "main" },
    stitchPath,
    edges,
    notches: sleeveCapNotches(capFrontMm),
    bodyLines: [],
    sleeveCap: {
      edgeIds: [SLEEVE_EDGE.capBack, SLEEVE_EDGE.capFront],
      armholeRefs: [
        { pieceId: BACK_PIECE_ID, edgeId: BODICE_ARMHOLE_EDGE },
        { pieceId: FRONT_PIECE_ID, edgeId: BODICE_ARMHOLE_EDGE },
      ],
    },
    grainLine: [pt(0, SLEEVE_GRAIN_END_INSET_MM), pt(0, hemYMm - SLEEVE_GRAIN_END_INSET_MM)],
    darts: [],
  };
}

/**
 * Drafts the set-in sleeve. Pure. The cap height is solved so the cap is `SLEEVE_CAP_TARGET_EASE_MM` longer than
 * the whole armhole; the cap is split at the shoulder point so each half carries ease in proportion to its
 * armhole (decision 134, 2).
 *
 * @param input - Widths, arm length, bodice armhole lengths and the length option.
 * @param options - Seam allowance table; defaults to the schema defaults.
 * @returns The sleeve piece, its key points, the cap height and the drafted cap ease.
 * @throws {DraftingError} SLEEVE_CAP_UNSOLVABLE or SLEEVE_LENGTH_TOO_SHORT.
 */
export function draftSleeve(
  input: SleeveInput,
  options: Pick<EngineOptions, "seamAllowance"> = DEFAULT_SEAM_OPTIONS,
): SleeveDraft {
  const armholeMm = input.armholeBackMm + input.armholeFrontMm;
  const capHeightMm = solveSleeveCapHeight({
    armholeLengthMm: armholeMm,
    bicepWidthMm: input.bicepHalfMm * 2,
    capEaseMm: SLEEVE_CAP_TARGET_EASE_MM,
  });
  const hemYMm = sleeveHemYMm(input.length, capHeightMm, input.armLengthMm);
  const cap = wholeCap(input.bicepHalfMm, capHeightMm);
  const backShare = input.armholeBackMm / armholeMm;
  const totalEaseMm = pathLength(cap) - armholeMm;
  const [capBack, capFront] = splitAtLength(cap, input.armholeBackMm + totalEaseMm * backShare);
  const keyPoints = sleeveKeyPoints(input, capHeightMm, hemYMm, capFront[0]!.from);
  const hemFront = keyPoints["sleeve.hemFront"];
  const hemBack = keyPoints["sleeve.hemBack"];
  const stitchPath: Segment[] = [
    ...capBack,
    ...capFront,
    lineSeg(keyPoints["sleeve.underarmFront"], hemFront),
    lineSeg(hemFront, hemBack),
    lineSeg(hemBack, keyPoints["sleeve.underarmBack"]),
  ];
  const edges = sleeveEdges({ capBack: capBack.length, capFront: capFront.length }, backShare, options);
  const capBackMm = pathLength(capBack);
  const capFrontMm = pathLength(capFront);
  return {
    piece: sleevePiece(stitchPath, edges, capFrontMm, hemYMm),
    keyPoints,
    capHeightMm,
    capEaseMm: {
      back: capBackMm - input.armholeBackMm,
      front: capFrontMm - input.armholeFrontMm,
      total: capBackMm + capFrontMm - armholeMm,
    },
    hemYMm,
  };
}
