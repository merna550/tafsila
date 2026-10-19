/**
 * The shirt collar: a stand and a collar fall (issue #141, decision 141, 7). Aldrich 6th ed., ch. 5, "Shirt collar
 * with stand": the fall's neck edge is the stand's top edge, so the two are equal by construction; the fall is
 * `SHIRT_COLLAR_WIDTH_MM` deep at CB and its point runs out past CF. Upper and under fall (the under trimmed by the
 * turn of cloth), a fall interfacing, the stand cut twice and its interfacing. The stand opens at CF and runs on by
 * the button extension when the closure is buttons.
 */
import type { DesignSpec, EngineOptions, Notch, Point, Segment } from "@tafsila/schemas";
import {
  COLLAR_TURN_OF_CLOTH_MM,
  SHIRT_COLLAR_HANDLE_SHARE,
  SHIRT_COLLAR_POINT_LENGTH_MM,
  SHIRT_COLLAR_POINT_OUT_MM,
  SHIRT_COLLAR_WIDTH_MM,
  SHIRT_STAND_CF_RISE_MM,
  SHIRT_STAND_HEIGHT_MM,
} from "../../constants/collar";
import { add, cubicSeg, lerp, lineSeg, pathLength, pt, scale, tangentAtLength } from "../../geometry";
import type { PieceDraft } from "../../pipeline/draft-context";
import {
  COLLAR_EDGE_IDS,
  COLLAR_PIECE_IDS,
  type CollarHolders,
  collarCut,
  collarPiece,
  grainNearEnd,
  type OuterPair,
  outerEdgeSpec,
  upperUnderPairs,
} from "./pieces";
import { type StandShape, standPieces, standShape } from "./stand";

/** The fall's outline and the length of its outer edge. */
interface FallOutline {
  /** Closed outline: stand edge, outer edge (point and curve), CB fold. */
  readonly outline: Segment[];
  /** Segments in the stand edge. */
  readonly standSegments: number;
  /** Outer edge length, in mm. */
  readonly outerMm: number;
}

/**
 * The collar fall: along the stand top from CB to CF, out to the point, back along the outer edge to CB (square to
 * the fold), down the fold.
 *
 * @param shape - The stand.
 * @param widthMm - Fall depth at CB.
 * @param pointMm - Point edge length.
 * @returns The outline.
 */
function fallOutline(shape: StandShape, widthMm: number, pointMm: number): FallOutline {
  const top = shape.top;
  const topCb = top[0]!.from;
  const topCf = top.at(-1)!.to;
  const along = tangentAtLength(top, pathLength(top));
  const up: Point = pt(along.y, -along.x);
  const rise = Math.sqrt(pointMm ** 2 - SHIRT_COLLAR_POINT_OUT_MM ** 2);
  const tip = add(add(topCf, scale(along, SHIRT_COLLAR_POINT_OUT_MM)), scale(up, rise));
  const cbOuter = pt(topCb.x, topCb.y - widthMm);
  const runMm = Math.abs(tip.x - cbOuter.x);
  const outer = [
    lineSeg(topCf, tip),
    cubicSeg(
      tip,
      lerp(tip, cbOuter, SHIRT_COLLAR_HANDLE_SHARE),
      pt(cbOuter.x + runMm * SHIRT_COLLAR_HANDLE_SHARE, cbOuter.y),
      cbOuter,
    ),
  ];
  return {
    outline: [...top, ...outer, lineSeg(cbOuter, topCb)],
    standSegments: top.length,
    outerMm: pathLength(outer),
  };
}

/**
 * Notches on the fall's stand edge at CB, above the shoulder and at CF; the finishing step repeats them on the stand
 * top (which runs CF to CB, so the pair is reversed).
 *
 * @param shape - The stand.
 * @param holders - The bodice neck holders, for the shoulder's share of the neck.
 * @returns The notches.
 */
function fallNotches(shape: StandShape, holders: CollarHolders): Notch[] {
  const topMm = pathLength(shape.top);
  const shoulderShare = holders.back.lengthMm / (holders.back.lengthMm + holders.front.lengthMm);
  const pairsWith = { pieceId: COLLAR_PIECE_IDS.stand, edgeId: COLLAR_EDGE_IDS.top, reversed: true };
  const edgeId = COLLAR_EDGE_IDS.stand;
  return [
    { id: "fall-cb", edgeId, atMm: 0, pairsWith },
    { id: "fall-shoulder", edgeId, atMm: topMm * shoulderShare, pairsWith },
    { id: "fall-cf", edgeId, atMm: topMm, pairsWith },
  ];
}

/**
 * Builds the shirt collar's five pieces.
 *
 * @param holders - The bodice neck holders.
 * @param closure - The design's closure (CF, checked by the combination rule).
 * @param options - Engine options, for the seam allowances.
 * @returns Stand, stand interfacing, upper and under fall, fall interfacing.
 */
export function shirtCollarPieces(
  holders: CollarHolders,
  closure: DesignSpec["closure"],
  options: Pick<EngineOptions, "seamAllowance">,
): PieceDraft[] {
  const shape = standShape(holders, SHIRT_STAND_HEIGHT_MM, SHIRT_STAND_CF_RISE_MM);
  const ends = { opening: "cb-fold" as const, extension: closure.type === "buttons", endRadiusMm: 0 };
  const topPair = { pieceId: COLLAR_PIECE_IDS.upper, edgeId: COLLAR_EDGE_IDS.stand, reversed: true };
  const stand = standPieces(shape, { holders, heightMm: SHIRT_STAND_HEIGHT_MM, ends, topPair }, options);
  const upper = fallOutline(shape, SHIRT_COLLAR_WIDTH_MM, SHIRT_COLLAR_POINT_LENGTH_MM);
  const under = fallOutline(
    shape,
    SHIRT_COLLAR_WIDTH_MM - COLLAR_TURN_OF_CLOTH_MM,
    SHIRT_COLLAR_POINT_LENGTH_MM - COLLAR_TURN_OF_CLOTH_MM,
  );
  const topCb = shape.top[0]!.from;
  /**
   * One fall piece.
   *
   * @param id - Piece id.
   * @param fall - Its outline.
   * @param pair - The outer edge's pair, or undefined for the interfacing.
   * @returns The piece.
   */
  const piece = (id: string, fall: FallOutline, pair?: OuterPair): PieceDraft =>
    collarPiece(
      {
        id,
        cut: collarCut("cb-fold", pair ? "main" : "interfacing"),
        outline: fall.outline,
        edges: [
          {
            id: COLLAR_EDGE_IDS.stand,
            kind: "other",
            segments: fall.standSegments,
            ...(pair
              ? {
                  pairsWith: { pieceId: COLLAR_PIECE_IDS.stand, edgeId: COLLAR_EDGE_IDS.top, reversed: true },
                }
              : {}),
          },
          outerEdgeSpec(2, pair),
          { id: COLLAR_EDGE_IDS.cb, kind: "fold", segments: 1 },
        ],
        notches: pair ? fallNotches(shape, holders) : [],
        grainLine: grainNearEnd(topCb, fall.outline.at(-1)!.from, pt(1, 0)),
      },
      options,
    );
  const pairs = upperUnderPairs(upper.outerMm, under.outerMm);
  return [
    ...stand,
    piece(COLLAR_PIECE_IDS.upper, upper, pairs.upper),
    piece(COLLAR_PIECE_IDS.under, under, pairs.under),
    piece(COLLAR_PIECE_IDS.interfacing, upper),
  ];
}
