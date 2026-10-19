/**
 * The peter pan collar (issue #141, decision 141, 5). Aldrich 6th ed., ch. 5, "Flat collars": the front and back
 * necks are traced with the shoulders laid together at the neck point and overlapped at the shoulder tip, which gives
 * the roll; the outer edge is the neck moved out by the collar width, rounded into the open ends. The neck edge is
 * the bodice neck itself (a rigid move keeps its length). Upper and under collar, the under trimmed by the turn of
 * cloth, and an interfacing.
 */
import type { EngineOptions, Segment } from "@tafsila/schemas";
import { FRONT_SIDE_PIECE_ID } from "../../blocks/bodice";
import {
  COLLAR_TURN_OF_CLOTH_MM,
  PETER_PAN_FRONT_RADIUS_MM,
  PETER_PAN_SHOULDER_BLEND_MM,
  PETER_PAN_SHOULDER_OVERLAP_MM,
  PETER_PAN_WIDTH_MM,
} from "../../constants/collar";
import {
  add,
  angleRad,
  cross,
  intersectSegments,
  lineSeg,
  mirrorAcross,
  offsetPath,
  pathLength,
  reversePath,
  rotateAbout,
  samePoint,
  splitSegmentAt,
  sub,
  tangentAtLength,
  translate,
  type Point,
} from "../../geometry";
import { edgeLengthMm, edgeSegments } from "../../pieces/measure";
import { SHOULDER_EDGE_ID } from "../../pieces/neck-seam";
import type { PieceDraft } from "../../pipeline/draft-context";
import { roundJoint } from "./corner";
import {
  COLLAR_EDGE_IDS,
  COLLAR_PIECE_IDS,
  type CollarHolders,
  type CollarNeck,
  type CollarOpening,
  collarCut,
  collarPiece,
  grainNearEnd,
  type OuterPair,
  outerEdgeSpec,
  upperUnderPairs,
  neckEdgeSpecs,
  neckNotches,
  towards,
} from "./pieces";

/**
 * Unit direction of a holder's shoulder, from the neck point out.
 *
 * @param piece - A bodice piece holding the neck.
 * @returns The direction.
 */
function shoulderDir(piece: PieceDraft): Point {
  const first = edgeSegments(piece, SHOULDER_EDGE_ID)[0]!;
  return towards(first.from, first.to);
}

/**
 * Whole front shoulder length (a princess shoulder seam splits it between the centre and side panels).
 *
 * @param pieces - Pieces drafted so far.
 * @param holders - The bodice neck holders.
 * @returns Length in mm.
 */
function frontShoulderMm(pieces: readonly PieceDraft[], holders: CollarHolders): number {
  const side = pieces.find((p) => p.id === FRONT_SIDE_PIECE_ID);
  const sideMm = side ? edgeLengthMm(side, SHOULDER_EDGE_ID) : 0;
  return edgeLengthMm(holders.front.piece, SHOULDER_EDGE_ID) + sideMm;
}

/**
 * The traced neck, in the front piece's frame: the back neck mirrored across its shoulder, laid on the front shoulder
 * at the neck point, then turned toward the front so the shoulder tips overlap `PETER_PAN_SHOULDER_OVERLAP_MM`.
 *
 * @param pieces - Pieces drafted so far.
 * @param holders - The bodice neck holders.
 * @returns The collar neck, CB to shoulder to CF.
 */
export function peterPanNeck(pieces: readonly PieceDraft[], holders: CollarHolders): CollarNeck {
  const front = holders.front.neck;
  const neckPoint = front.at(-1)!.to;
  const backPoint = holders.back.neck.at(-1)!.to;
  const frontDir = shoulderDir(holders.front.piece);
  const backDir = shoulderDir(holders.back.piece);
  const mirrored = mirrorAcross([...holders.back.neck], backPoint, add(backPoint, backDir));
  const laid = rotateAbout(
    translate(mirrored, sub(neckPoint, backPoint)),
    neckPoint,
    angleRad(frontDir) - angleRad(backDir),
  );
  const overlapRad = 2 * Math.asin(PETER_PAN_SHOULDER_OVERLAP_MM / (2 * frontShoulderMm(pieces, holders)));
  const towardFront = Math.sign(cross(frontDir, sub(front[0]!.from, neckPoint)));
  return { back: rotateAbout(laid, neckPoint, towardFront * overlapRad), front: reversePath(front) };
}

/** How many offset segments each side of the neck point are searched for the crossing of the two outer runs. */
const JOIN_SEARCH_SEGMENTS = 12;

/**
 * Joins the outer runs of the back and front necks at the neck point: where the neck turns in there, the runs cross,
 * are trimmed at the crossing and blended smooth (so the seam allowance does not cross itself); where it turns out, a
 * straight line bridges the gap.
 *
 * @param back - Outer run of the back neck, CB first.
 * @param front - Outer run of the front neck, shoulder first.
 * @returns The joined outer edge, CB to CF.
 */
function joinAtNeckPoint(back: readonly Segment[], front: readonly Segment[]): Segment[] {
  const from = Math.max(0, back.length - JOIN_SEARCH_SEGMENTS);
  for (let i = back.length - 1; i >= from; i -= 1) {
    for (let j = 0; j < Math.min(front.length, JOIN_SEARCH_SEGMENTS); j += 1) {
      const hit = intersectSegments(back[i]!, front[j]!)[0];
      if (!hit) continue;
      const blend = roundJoint(
        [...back.slice(0, i), splitSegmentAt(back[i]!, hit.t1)[0]],
        [splitSegmentAt(front[j]!, hit.t2)[1], ...front.slice(j + 1)],
        PETER_PAN_SHOULDER_BLEND_MM,
      );
      return [...blend.before, blend.arc, ...blend.after];
    }
  }
  const gap = samePoint(back.at(-1)!.to, front[0]!.from) ? [] : [lineSeg(back.at(-1)!.to, front[0]!.from)];
  return [...back, ...gap, ...front];
}

/** The outline of one peter pan piece with its edge runs. */
interface PeterPanOutline {
  /** Closed outline. */
  readonly outline: Segment[];
  /** Segments in the outer edge (CF end, outer curve and, for a pair, the CB end). */
  readonly outerSegments: number;
  /** Length of the outer edge, in mm. */
  readonly outerMm: number;
  /** Where the CB line meets the outer edge (for the grain line). */
  readonly cbOuter: Point;
}

/**
 * The outline: the neck, the CF end rounded into the outer edge, and the CB end (a fold, or rounded for a pair).
 *
 * @param neck - The collar neck.
 * @param widthMm - Collar width.
 * @param opening - Where the collar opens.
 * @returns The outline and its outer edge's segment count.
 */
function peterPanOutline(neck: CollarNeck, widthMm: number, opening: CollarOpening): PeterPanOutline {
  const neckPath = [...neck.back, ...neck.front];
  const outer = joinAtNeckPoint(offsetPath(neck.back, widthMm), offsetPath(neck.front, widthMm));
  const cbNeck = neckPath[0]!.from;
  const cbOuter = outer[0]!.from;
  const cf = roundJoint(
    [lineSeg(neckPath.at(-1)!.to, outer.at(-1)!.to)],
    reversePath(outer),
    PETER_PAN_FRONT_RADIUS_MM,
  );
  const cbLine = [lineSeg(cbOuter, cbNeck)];
  const cb = opening === "pair" ? roundJoint(cf.after, cbLine, PETER_PAN_FRONT_RADIUS_MM) : undefined;
  const outerRun = cb
    ? [...cf.before, cf.arc, ...cb.before, cb.arc, ...cb.after]
    : [...cf.before, cf.arc, ...cf.after];
  return {
    outline: [...neckPath, ...outerRun, ...(cb ? [] : cbLine)],
    outerSegments: outerRun.length,
    outerMm: pathLength(outerRun),
    cbOuter,
  };
}

/** What the peter pan pieces are drafted from. */
export interface PeterPanInput {
  /** Pieces drafted so far. */
  readonly pieces: readonly PieceDraft[];
  /** The bodice neck holders. */
  readonly holders: CollarHolders;
  /** Where the collar opens. */
  readonly opening: CollarOpening;
}

/**
 * Builds the upper collar, the under collar (outer edge `COLLAR_TURN_OF_CLOTH_MM` in) and the interfacing.
 *
 * @param input - Pieces, holders and opening.
 * @param options - Engine options, for the seam allowances.
 * @returns The three pieces.
 */
export function peterPanPieces(
  input: PeterPanInput,
  options: Pick<EngineOptions, "seamAllowance">,
): PieceDraft[] {
  const { holders, opening } = input;
  const neck = peterPanNeck(input.pieces, holders);
  const upper = peterPanOutline(neck, PETER_PAN_WIDTH_MM, opening);
  const under = peterPanOutline(neck, PETER_PAN_WIDTH_MM - COLLAR_TURN_OF_CLOTH_MM, opening);
  const cbNeck = neck.back[0]!.from;
  const inward = tangentAtLength(neck.back, 0);
  /**
   * One peter pan piece.
   *
   * @param id - Piece id.
   * @param shape - Its outline.
   * @param pair - The outer edge's pair, or undefined for the interfacing.
   * @returns The piece.
   */
  const piece = (id: string, shape: PeterPanOutline, pair?: OuterPair): PieceDraft =>
    collarPiece(
      {
        id,
        cut: collarCut(opening, pair ? "main" : "interfacing"),
        outline: shape.outline,
        edges: [
          ...neckEdgeSpecs(neck, holders, pair !== undefined),
          outerEdgeSpec(shape.outerSegments, pair),
          ...(opening === "pair" ? [] : [{ id: COLLAR_EDGE_IDS.cb, kind: "fold" as const, segments: 1 }]),
        ],
        notches: pair ? neckNotches(holders) : [],
        grainLine: grainNearEnd(cbNeck, shape.cbOuter, inward),
      },
      options,
    );
  const pairs = upperUnderPairs(upper.outerMm, under.outerMm);
  return [
    piece(COLLAR_PIECE_IDS.upper, upper, pairs.upper),
    piece(COLLAR_PIECE_IDS.under, under, pairs.under),
    piece(COLLAR_PIECE_IDS.interfacing, upper),
  ];
}
