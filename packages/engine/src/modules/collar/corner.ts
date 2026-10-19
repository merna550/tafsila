/**
 * Rounds the corner where one run of segments meets the next (issue #141): the collar ends, the button extension and
 * the mandarin's open end. The arc is a single cubic tangent to both runs, a circular arc for straight runs.
 */
import type { Segment } from "@tafsila/schemas";
import { CUBIC_ARC_FACTOR } from "../../constants/collar";
import { DraftingError } from "../../errors/drafting-error";
import {
  add,
  cubicSeg,
  cutPath,
  dot,
  pathLength,
  scale,
  sub,
  tangentAtLength,
  type CubicSegment,
} from "../../geometry";

/** Quarter of the turn angle, for the handle length. */
const QUARTER = 4;

/** The two runs with the corner between them replaced by an arc. */
export interface RoundedJoint {
  /** The first run, shortened by the radius. */
  readonly before: Segment[];
  /** The arc from the end of `before` to the start of `after`. */
  readonly arc: CubicSegment;
  /** The second run, starting the radius after the corner. */
  readonly after: Segment[];
}

/**
 * Rounds the corner at the end of `before` (the start of `after`): each run is cut `radiusMm` from the corner along
 * its length and the gap is closed by a cubic tangent to both.
 *
 * @param before - Run that ends at the corner.
 * @param after - Run that starts at the corner.
 * @param radiusMm - Distance from the corner to each tangent point, in mm.
 * @returns The shortened runs and the arc.
 * @throws {DraftingError} COLLAR_CORNER_INVALID when a run is not longer than the radius or the runs do not turn.
 */
export function roundJoint(
  before: readonly Segment[],
  after: readonly Segment[],
  radiusMm: number,
): RoundedJoint {
  const beforeMm = pathLength(before);
  if (beforeMm <= radiusMm || pathLength(after) <= radiusMm) {
    throw new DraftingError("COLLAR_CORNER_INVALID", `A run is too short for a ${radiusMm} mm corner`);
  }
  const [kept] = cutPath(before, beforeMm - radiusMm);
  const [, rest] = cutPath(after, radiusMm);
  const inDir = tangentAtLength(before, beforeMm - radiusMm);
  const outDir = tangentAtLength(after, radiusMm);
  const turnRad = Math.acos(Math.min(1, Math.max(-1, dot(inDir, outDir))));
  if (turnRad <= 0) throw new DraftingError("COLLAR_CORNER_INVALID", "The runs meet without a corner");
  const handleMm = (CUBIC_ARC_FACTOR * Math.tan(turnRad / QUARTER) * radiusMm) / Math.tan(turnRad / 2);
  const from = kept.at(-1)!.to;
  const to = rest[0]!.from;
  return {
    before: kept,
    arc: cubicSeg(from, add(from, scale(inDir, handleMm)), sub(to, scale(outDir, handleMm)), to),
    after: rest,
  };
}
