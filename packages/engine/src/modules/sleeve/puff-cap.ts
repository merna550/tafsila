/**
 * The puff head (issue #142, decision 142, 2). Aldrich 6th ed., ch. 2 (sleeve variations: slash and spread the head):
 * the cap below the balance notches stays as in the set-in block, so the notches and the underarm match unchanged;
 * the cap between the back and front notches is redrawn higher and wider through two top points, with the block's
 * tangents at the notches, and its rise is solved so it is exactly `PUFF_CAP_GATHER_RATIO` times the block's.
 */
import type { Mark } from "@tafsila/schemas";
import { SLEEVE_EDGE } from "../../blocks/sleeve/ids";
import type { SleeveDraft } from "../../blocks/sleeve/types";
import {
  SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM,
  SLEEVE_DOUBLE_NOTCH_GAP_MM,
  SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM,
} from "../../constants/sleeve-block";
import {
  PUFF_CAP_GATHER_RATIO,
  PUFF_CAP_MAX_RISE_MM,
  PUFF_CAP_TOLERANCE_MM,
  PUFF_CAP_TOP_WIDTH_SHARE,
} from "../../constants/sleeve-style";
import { DraftingError } from "../../errors/drafting-error";
import {
  type CubicSegment,
  curveThroughPoints,
  pathLength,
  type Point,
  pt,
  type Segment,
  splitAtLength,
  subPath,
  tangentAtLength,
} from "../../geometry";
import { gatherLineMark } from "../../pieces/gather-mark";
import { edgeLengthMm, edgeSegments } from "../../pieces/measure";

/** The cap is redrawn above the upper back notch, so both marks of the double notch stay on the block cap. */
const BACK_KEPT_MM = SLEEVE_BACK_NOTCH_FROM_UNDERARM_MM + SLEEVE_DOUBLE_NOTCH_GAP_MM;

/** Safety limit on the rise search (bisection halves the range each time). */
const MAX_ITERATIONS = 60;

/** The redrawn cap and what it declares. */
export interface PuffCap {
  /** Back cap, underarm to shoulder point. */
  readonly capBack: Segment[];
  /** Front cap, shoulder point to underarm. */
  readonly capFront: Segment[];
  /** Length added to each half by the puff, gathered back when sewn. */
  readonly gatherMm: { readonly back: number; readonly front: number };
  /** One gather mark per cap half, between its notch and the shoulder point. */
  readonly marks: Mark[];
}

/** The part of the block cap the puff redraws. */
interface Head {
  /** Start (back notch) and end (front notch) of the redrawn part. */
  readonly from: Point;
  readonly to: Point;
  /** Block tangents at the two ends, in path direction. */
  readonly fromTangent: Point;
  readonly toTangent: Point;
  /** Half the width between the two top points. */
  readonly topHalfMm: number;
}

/**
 * The head curve for a rise above the cap top.
 *
 * @param head - The redrawn part.
 * @param riseMm - Height of the two top points above the block cap top (y = 0).
 * @returns The curve from the back notch to the front notch.
 */
function headCurve(head: Head, riseMm: number): CubicSegment[] {
  const points = [head.from, pt(-head.topHalfMm, -riseMm), pt(head.topHalfMm, -riseMm), head.to];
  return curveThroughPoints(points, head.fromTangent, head.toTangent);
}

/**
 * Solves the rise so the head is `targetMm` long (its length grows with the rise, so bisection converges).
 *
 * @param head - The redrawn part.
 * @param targetMm - Head length to reach.
 * @returns The head curve.
 * @throws {DraftingError} SLEEVE_PUFF_UNSOLVABLE when no rise in [0, PUFF_CAP_MAX_RISE_MM] reaches the target.
 */
function solveHead(head: Head, targetMm: number): CubicSegment[] {
  let low = 0;
  let high = PUFF_CAP_MAX_RISE_MM;
  if (pathLength(headCurve(head, low)) > targetMm || pathLength(headCurve(head, high)) < targetMm) {
    throw new DraftingError("SLEEVE_PUFF_UNSOLVABLE", `No puff head reaches ${targetMm} mm`);
  }
  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    const mid = (low + high) / 2;
    const lengthMm = pathLength(headCurve(head, mid));
    if (Math.abs(lengthMm - targetMm) <= PUFF_CAP_TOLERANCE_MM) return headCurve(head, mid);
    if (lengthMm < targetMm) low = mid;
    else high = mid;
  }
  return headCurve(head, (low + high) / 2);
}

/**
 * Redraws the block cap as a puff head.
 *
 * @param block - The set-in sleeve block.
 * @param bicepWidthMm - Sleeve width at the upper arm.
 * @returns The new cap halves, the gathered lengths and the gather marks.
 * @throws {DraftingError} SLEEVE_PUFF_UNSOLVABLE when no head fits.
 */
export function puffCap(block: SleeveDraft, bicepWidthMm: number): PuffCap {
  const whole = [
    ...edgeSegments(block.piece, SLEEVE_EDGE.capBack),
    ...edgeSegments(block.piece, SLEEVE_EDGE.capFront),
  ];
  const capMm = pathLength(whole);
  const frontKeptFromMm = capMm - SLEEVE_FRONT_NOTCH_FROM_UNDERARM_MM;
  const middle = subPath(whole, BACK_KEPT_MM, frontKeptFromMm);
  const middleMm = pathLength(middle);
  const backMiddleMm = edgeLengthMm(block.piece, SLEEVE_EDGE.capBack) - BACK_KEPT_MM;
  const head = solveHead(
    {
      from: middle[0]!.from,
      to: middle.at(-1)!.to,
      fromTangent: tangentAtLength(whole, BACK_KEPT_MM),
      toTangent: tangentAtLength(whole, frontKeptFromMm),
      topHalfMm: (bicepWidthMm * PUFF_CAP_TOP_WIDTH_SHARE) / 2,
    },
    middleMm * PUFF_CAP_GATHER_RATIO,
  );
  const headMm = pathLength(head);
  const [headBack, headFront] = splitAtLength(head, (headMm * backMiddleMm) / middleMm);
  const shoulder = headFront[0]!.from;
  const frontMiddleMm = middleMm - backMiddleMm;
  return {
    capBack: [...subPath(whole, 0, BACK_KEPT_MM), ...headBack],
    capFront: [...headFront, ...subPath(whole, frontKeptFromMm, capMm)],
    gatherMm: {
      back: pathLength(headBack) - backMiddleMm,
      front: pathLength(headFront) - frontMiddleMm,
    },
    marks: [
      gatherLineMark(SLEEVE_EDGE.capBack, head[0]!.from, shoulder, backMiddleMm),
      gatherLineMark(SLEEVE_EDGE.capFront, shoulder, head.at(-1)!.to, frontMiddleMm),
    ],
  };
}
